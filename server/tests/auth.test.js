import http from 'http';
import mongoose from 'mongoose';
import crypto from 'crypto';

import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

async function startHttpServer() {
  return new Promise((resolve) => {
    const instance = http.createServer(app);
    instance.listen(0, () => resolve(instance));
  });
}

describe('Authentication controller integration', () => {
  const uniqueSuffix = crypto.randomUUID();
  const credentials = {
    name: `Test Runner ${uniqueSuffix}`,
    email: `test.runner.${uniqueSuffix}@example.com`,
    password: `P@ssw0rd-${uniqueSuffix.slice(0, 8)}`
  };

  let serverInstance;
  let baseUrl;
  let issuedToken;

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ email: credentials.email.toLowerCase() });

    serverInstance = await startHttpServer();
    const { port } = serverInstance.address();
    baseUrl = `http://127.0.0.1:${port}/api`;
  });

  afterAll(async () => {
    await User.deleteOne({ email: credentials.email.toLowerCase() });
    await new Promise((resolve) => serverInstance.close(resolve));
    await mongoose.connection.close();
  });

  test('registers a brand-new user and returns a JWT for immediate use', async () => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.token).toBeTruthy();
    expect(payload.user.email).toBe(credentials.email.toLowerCase());
    expect(payload.user).not.toHaveProperty('passwordHash');

    issuedToken = payload.token;
  });

  test('authenticates the same user and issues a fresh JWT', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.token).toBeTruthy();
    expect(typeof payload.token).toBe('string');
    expect(payload.user.email).toBe(credentials.email.toLowerCase());
    expect(payload.user).not.toHaveProperty('passwordHash');

    expect(payload.token).not.toBe(issuedToken);
    issuedToken = payload.token;
  });

  test('returns the public profile for the currently authenticated user', async () => {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${issuedToken}` }
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user.email).toBe(credentials.email.toLowerCase());
    expect(payload.user).not.toHaveProperty('passwordHash');
  });
});
