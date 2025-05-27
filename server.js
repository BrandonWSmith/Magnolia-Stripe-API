const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'https://magnoliacremations.com',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/create-checkout-session', async (req, res) => {
  const { price } = req.body;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Magnolia Pre-Planning',
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        verification_method: 'instant',
        financial_connections: {
          permissions: ['payment_method'],
        },
      },
    },
    success_url: 'https://magnolia-cremations.myshopify.com/pages/thank-you',
  });
  
  res.json({url: session.url});
});

app.post('/create-checkout-session-embeded', async (req, res) => {
  const { price } = req.body;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Magnolia Pre-Planning',
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    ui_mode: 'custom',
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        verification_method: 'instant',
        financial_connections: {
          permissions: ['payment_method'],
        },
      },
    },
    return_url: 'https://magnolia-cremations.myshopify.com/pages/thank-you',
  });

  res.json({checkoutSessionClientSecret: session.client_secret});
});

app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: 'usd',
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          prefetch: ['balances', 'ownership'],
          permissions: ['payment_method', 'balances', 'ownership'],
        },
      },
    },
  });

  res.set('Access-Control-Allow-Origin', 'https://magnoliacremations.com');
  res.json({client_secret: paymentIntent.client_secret});
});

app.post('/get-account', async (req, res) => {
  const { paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ['payment_method'],
    }
  );

  const account = await stripe.financialConnections.accounts.retrieve(
    paymentIntent.payment_method.us_bank_account.financial_connections_account,
    {
      expand: ['ownership'],
    }
  );

  res.json({account: account, paymentMethod: paymentIntent.payment_method});
});

app.post('/get-payment-intent', async (req, res) => {
  const { paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId
  );

  res.json({paymentIntent: paymentIntent});
});

let ip;
let hulkFormData;

app.post('/store-form-data', (req, res) => {
  const { formData } = req.body;
  ip = req.headers['x-forward-for'] || req.socket.remoteAddress;
  hulkFormData = formData;

  res.status(201).json({message: "Form data temporarily stored on server", url: "https://magnolia-cremations.myshopify.com/pages/thank-you"});
});

app.get('/get-form-data', (req, res) => {
  if (req.headers['x-forward-for'] === ip || req.socket.remoteAddress === ip) {
    res.json({hulkFormData: hulkFormData});
  } else {
    console.log('IP does not match');
    res.json({message: "There was an issue retrieving form data"});
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));