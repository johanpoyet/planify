import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import {
  clearAttempts,
  isRateLimited,
  logSecurityEvent,
  maskEmail,
  recordFailedAttempt,
} from './security';

// Configuration NextAuth.js
export const authOptions: NextAuthOptions = {
  // Pas d'adaptateur pour éviter les transactions MongoDB
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const email = credentials.email.toLowerCase().trim();
        // La cle combine l'adresse visee et l'origine de la requete : elle
        // freine aussi bien l'acharnement sur un compte que le balayage
        // d'adresses depuis une meme source.
        const ip =
          (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          (req?.headers?.['x-real-ip'] as string) ||
          'inconnue';
        const key = `${email}|${ip}`;

        const { limited, retryAfterMs } = isRateLimited(key);
        if (limited) {
          logSecurityEvent('login_blocked', {
            email: maskEmail(email),
            ip,
            retryAfterSec: Math.ceil(retryAfterMs / 1000),
          });
          throw new Error(
            `Trop de tentatives. Reessayez dans ${Math.ceil(retryAfterMs / 60000)} minutes.`
          );
        }

        // Rechercher l'utilisateur par email
        const user = await prisma.user.findUnique({ where: { email } });

        // Message identique que le compte existe ou non, afin de ne pas
        // reveler l'existence d'une adresse.
        const isPasswordValid =
          !!user?.password &&
          (await bcrypt.compare(credentials.password, user.password));

        if (!isPasswordValid) {
          const { locked } = recordFailedAttempt(key);
          logSecurityEvent('login_failure', {
            email: maskEmail(email),
            ip,
            locked: locked ? 'oui' : 'non',
          });
          throw new Error('Email ou mot de passe incorrect');
        }

        clearAttempts(key);
        logSecurityEvent('login_success', { email: maskEmail(email), ip });

        return {
          id: user!.id,
          email: user!.email,
          name: user!.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
