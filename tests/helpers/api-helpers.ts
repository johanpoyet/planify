/**
 * Cree un objet Request mock pour tester les route handlers Next.js
 */
export function createMockRequest(
  method: string,
  body?: any,
  url: string = 'http://localhost:3000/api/test',
  headers?: Record<string, string>
): Request {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

/**
 * Extrait le JSON d'une Response
 */
export async function getResponseJson(response: Response) {
  return response.json();
}

/**
 * Cree un objet FormData mock avec un fichier
 */
export function createMockFormData(
  fieldName: string,
  fileName: string,
  content: string = 'fake-content',
  type: string = 'image/jpeg'
): FormData {
  const formData = new FormData();
  const blob = new Blob([content], { type });
  const file = new File([blob], fileName, { type });
  formData.append(fieldName, file);
  return formData;
}
