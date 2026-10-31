import { meResponseSchema, type MeResponse } from '@caqui-chatbot/shared';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, apiGet } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    apiGet('/me', meResponseSchema)
      .then(setMe)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) window.location.assign('/login');
      });
  }, []);

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>caqui-chatbot</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {me ? (
            <p>
              Logado como <strong>{me.email}</strong>
            </p>
          ) : (
            <p>Carregando…</p>
          )}
          <Button variant="outline" onClick={() => void signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
