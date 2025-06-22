import { Router } from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const router = Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

router.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.REDIRECT_URI!,
    scope: scopes,
    show_dialog: "true",
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const authHeader = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI!,
      }),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    res.send(`
      <html>
        <head>
          <title>Autenticação concluída</title>
          <script>
            window.opener.postMessage({
              type: 'spotify-auth-success',
              access_token: '${access_token}',
              refresh_token: '${refresh_token}',
              expires_in: ${expires_in}
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <p>Autenticação concluída com sucesso. Você pode fechar esta janela.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Erro no callback:", error);
    res.send(`
      <html>
        <head>
          <title>Erro na autenticação</title>
          <script>
            window.opener.postMessage({
              type: 'spotify-auth-error',
              error: 'authentication_failed'
            }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <p>Ocorreu um erro na autenticação. Você pode fechar esta janela.</p>
        </body>
      </html>
    `);
  }
});

export default router;
