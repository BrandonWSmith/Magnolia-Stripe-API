const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const stripe = require('stripe')('sk_test_51QACVHHm46eDZJRscbUvCbR6YRllCd2EGydGq5kOWFhilvyZ8kTHClpatY3qSZ7wExuWABeZcrMnd16SC5MDAIVy00nFCWyqlx')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['https://magnoliacremations.com', 'https://magnolia-cremations.myshopify.com'],
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

app.post('/secret', async (req, res) => {
  const { price } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: 'usd',
  });

  res.set('Access-Control-Allow-Origin', 'https://magnoliacremations.com');
  res.json({client_secret: paymentIntent.client_secret});
});

app.listen(port, () => console.log(`Listening on port ${port}`));