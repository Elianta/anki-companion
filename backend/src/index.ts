import 'dotenv/config';
import { buildAppFromEnv } from './app-factory.js';

const port = Number(process.env.PORT) || 3001;

const app = buildAppFromEnv();

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
