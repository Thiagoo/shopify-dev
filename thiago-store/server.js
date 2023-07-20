//modules required
import express from 'express';
import 'dotenv/config';
import '@shopify/shopify-api/adapters/node';
import {
  shopifyApi,
  ApiVersion,
  LATEST_API_VERSION,
} from '@shopify/shopify-api';

const app = express();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_API_SCOPES,
  SHOPIFY_STORE,
  LOCAL_HOST,
  HOST_SCHEME,
  MY_END_POINT,
} = process.env;

const shopify = shopifyApi({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  scopes: SHOPIFY_API_SCOPES,
  hostName: LOCAL_HOST,
  hostScheme: HOST_SCHEME,
  apiVersion: ApiVersion.July23,
  isEmbeddedApp: true,
});

app.get('/', async (req, res) => {
  res.redirect('/auth/shopify');
});

//shopify auth begin
app.get('/auth/shopify', async (req, res) => {
  // The library will automatically redirect the user
  await shopify.auth.begin({
    shop: SHOPIFY_STORE,
    callbackPath: '/auth/shopify/callback',
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
});

//shopify auth callback
app.get(MY_END_POINT, async (req, res) => {
  // The library will automatically set the appropriate HTTP headers
  try {
    const redirectURL = await shopify.auth.getEmbeddedAppUrl({
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect(redirectURL);
  } catch (error) {
    console.error('Error :', error.message);
    res.status(500).send('Authentication failed.');
  }
});

app.get(MY_END_POINT, async (req, res) => {
  const sessionId = await shopify.session.getCurrentId({
    isOnline: true,
    rawRequest: req,
    rawResponse: res,
  });

  // use sessionId to retrieve session from app's session storage
  // getSessionFromStorage() must be provided by application
  const session = await getSessionFromStorage(sessionId);
  console.log('session ----' + sessionId);

  const client = new shopify.clients.Graphql({
    session,
    apiVersion: ApiVersion.July23,
  });
  console.log('client ----' + client);

  const response = await client.query({
    data: `{
      products(first: 5) {
        edges {
            node {
            id
            title
            }
        }
    }
    }`,
  });
  console.log('response ----' + response.headers, response.body);
});

//port initialization
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));
