const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 11000;
require('@shopify/shopify-api/adapters/node');
const { Session, shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY)
const stripeTest = require('stripe')(process.env.STRIPE_SERVER_KEY_TEST);
// const stripeTest = require('stripe')(process.env.STRIPE_SERVER_KEY_TEST, {
//   apiVersion: '2025-03-31.basil; checkout_server_update_beta=v1'
// });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/klaviyo-calculator-used', async (req, res) => {
  const { formData } = req.body;
  const body = `{
    "data":{
      "type":"event",
      "attributes":{
        "properties":${JSON.stringify(formData)},
        "metric":{
          "data":{
            "type":"metric",
            "attributes":{
              "name":"Calculator Used"
            }
          }
        },
        "profile":{
          "data":{
            "type":"profile",
            "attributes":{
              "email":"hello@magnoliacremations.com"
            }
          }
        }
      }
    }
  }`;

  const url = 'https://a.klaviyo.com/api/events';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    },
    body: body
  };

  fetch(url, options)
    .then(response => response.status === 202 ? res.status(202).send() : console.log(response))
    .catch(err => console.error(err));
});

app.post('/klaviyo-calculator-contact', async (req, res) => {
  const { formData } = req.body;
  const body = `{
    "data":{
      "type":"event",
      "attributes":{
        "properties":${JSON.stringify(formData)},
        "metric":{
          "data":{
            "type":"metric",
            "attributes":{
              "name":"Calculator Contact"
            }
          }
        },
        "profile":{
          "data":{
            "type":"profile",
            "attributes":{
              "email":"hello@magnoliacremations.com"
            }
          }
        }
      }
    }
  }`;

  const url = 'https://a.klaviyo.com/api/events';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    },
    body: body
  };

  fetch(url, options)
    .then(response => response.status === 202 ? res.status(202).send() : console.log(response))
    .catch(err => console.error(err));
});

app.post('/klaviyo-calculator-email', async (req, res) => {
  const { formData } = req.body;
  const body = `{
    "data":{
      "type":"event",
      "attributes":{
        "properties":${JSON.stringify(formData)},
        "metric":{
          "data":{
            "type":"metric",
            "attributes":{
              "name":"Calculator Data"
            }
          }
        },
        "profile":{
          "data":{
            "type":"profile",
            "attributes":{
              "email":"${formData.email}"
            }
          }
        }
      }
    }
  }`;

  const url = 'https://a.klaviyo.com/api/events';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    },
    body: body
  };

  fetch(url, options)
    .then(response => {
      if (response.status === 202) {
        res.status(202).json({data: response});
      } else {
        res.json({data: response});
        console.log(response);
      }
    })
    .catch(err => {
      res.json({data: err});
      console.error(err);
    });
});

app.post('/klaviyo-checkout-event', async (req, res) => {
  const { formData } = req.body;
  const body = `{
    "data":{
      "type":"event",
      "attributes":{
        "properties":${JSON.stringify(formData)},
        "metric":{
          "data":{
            "type":"metric",
            "attributes":{
              "name":"Form Data"
            }
          }
        },
        "profile":{
          "data":{
            "type":"profile",
            "attributes":{
              "location":{
                "address1":"${formData.form_data.contact_street_address}",
                "city":"${formData.form_data.contact_city}",
                "country":"United States",
                "region":"${formData.form_data.contact_state}",
                "zip":"${formData.form_data.contact_zip_code}"
              },
              "email":"${formData.form_data.contact_email}",
              "phone_number":"+1${formData.form_data.contact_phone.replaceAll("-", "")}",
              "first_name":"${formData.form_data.contact_first_name}",
              "last_name":"${formData.form_data.contact_last_name}"
            }
          }
        }
      }
    }
  }`;
  
  const url = 'https://a.klaviyo.com/api/events';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    },
    body: body
  };

  fetch(url, options)
    .then(response => response.status === 202 ? res.send() : console.log(response))
    .catch(err => console.error(err));
});

app.post('/shopify-admin-api', async (req, res) => {
  const { queryString, variables } = req.body;
  const shopify = shopifyApi({
    apiVersion: LATEST_API_VERSION,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
    scopes: ['write_orders', 'write_customers'],
    hostName: 'https://impact-ma-andorra-wrapped.trycloudflare.com',
    isEmbeddedApp: true,
    isCustomStoreApp: true,
    adminApiAccessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
  });
  const sessionId = shopify.session.getOfflineId('magnolia-cremations.myshopify.com');
  const session = new Session({
    id: sessionId,
    shop: 'magnolia-cremations.myshopify.com',
    state: 'state',
    isOnline: false,
  });
  const client = new shopify.clients.Graphql({ session: session });
  try {
    const data = await client.request(queryString, {
      variables: variables,
    });

    res.json({data: data});
  } catch (e) {
    console.log(e.response.body);
    res.status(400).json({data: e});
  }
});

app.post('/opt-in', async (req, res) => {
  const { email } = req.body;
  
  const getProfileUrl = `https://a.klaviyo.com/api/profiles?filter=equals%28email%2C%27${email}%27%29&page[size]=1`;
  const getProfileOptions = {
    method: 'GET',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    }
  };

  let profileId;
  fetch(getProfileUrl, getProfileOptions)
    .then(response => response.json())
    .then(data => profileId = data.data[0].id)
    .then(() => {
      const addToListUrl = 'https://a.klaviyo.com/api/lists/VD4cVf/relationships/profiles';
      const addToListOptions = {
        method: 'POST',
        headers: {
          accept: 'application/vnd.api+json',
          revision: '2025-04-15',
          'content-type': 'application/vnd.api+json',
          Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
        },
        body: `{"data":[{"type":"profile","id":"${profileId}"}]}`
      };

      fetch(addToListUrl, addToListOptions)
        .then(response => res.json({data: response.status}));
    });
});

app.post('/create-payment-intent', async (req, res) => {
  const { price, formData } = req.body;

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
    description: `Purchaser: ${JSON.parse(formData.contact).first_name} ${JSON.parse(formData.contact).last_name}`,
    metadata: formData,
  });

    res.json({client_secret: paymentIntent.client_secret, id: paymentIntent.id});
});

app.post('/update-payment-intent', (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      order_id: orderId,
    },
  });

  res.json();
});

app.post('/prepare-payment', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, amount } = req.body;

    // Attach the PaymentMethod to the PaymentIntent
    await stripe.paymentIntents.update(
      paymentIntentId,
      { payment_method: paymentMethodId }
    );

    // Retrieve the PaymentMethod details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    let insufficientFunds = false;
    let balanceAmount = null;
    let isInstantVerification = false;

    // Check if it's an instant verification account
    if (paymentMethod.us_bank_account && paymentMethod.us_bank_account.financial_connections_account) {
      isInstantVerification = true;
      const account = await stripe.financialConnections.accounts.retrieve(
        paymentMethod.us_bank_account.financial_connections_account
      );

      if (account.balance && account.balance.current) {
        balanceAmount = account.balance.current.usd;
        insufficientFunds = balanceAmount < amount;
      }
    } else {
      // This is a micro-deposit verification account
      isInstantVerification = false;
    }

    res.json({ 
      success: true, 
      insufficientFunds, 
      balanceAmount,
      isInstantVerification
    });
  } catch (error) {
    console.error('Error in prepare-payment:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/create-checkout-session', async (req, res) => {
  const { price, email, loved_one } = req.body;
  const sessionSettings = {
    mode: 'payment',
    ui_mode: 'custom',
    // permissions: {
    //   update_line_items: 'server_only',
    // },
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Donation',
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    currency: 'usd',
    payment_method_types: ['us_bank_account', 'card'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method'],
        },
      },
    },
    return_url: 'https://magnolia-cremations.myshopify.com/pages/donation-thank-you',
  };

  if (loved_one && loved_one !== '') {
    sessionSettings.payment_intent_data = {
      description: `Donation for loved one: ${loved_one}`,
      metadata:{
        loved_one: loved_one,
      }
    };
  } else {
    sessionSettings.payment_intent_data = {
      description: 'Donation',
    };
  }

  const session = await stripe.checkout.sessions.create(sessionSettings);

  res.json({client_secret: session.client_secret});
});

app.post('/update-checkout-session', async (req, res) => {
  const { sessionId, price } = req.body;

  await stripeTest.checkout.sessions.update(sessionId, {
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Donation',
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
  });

  res.json({type: 'success'});
});

app.post('/get-payment-intent', async (req, res) => {
  const { paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId
  );

  res.json({paymentIntent: paymentIntent});
});

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  let event = req.body;

  if (webhookSecret) {
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.sendStatus(400);
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    const queryString = `mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        userErrors {
          field
          message
        }
        order {
          id
        }
      }
    }`;

    const variables = {
      'input': {
        'id': paymentIntent.metadata.order_id,
      }
    };

    await fetch('https://magnolia-api.onrender.com/shopify-admin-api', 
    {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: queryString, variables: variables}),
    })
    .then(response => response.status === 200 ? res.send() : console.log(response));
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent failed! ID: ${paymentIntent.id}`);
  }

  res.send();
});

let ip;
let hulkFormData;

app.post('/store-form-data', (req, res) => {
  const { formData } = req.body;
  ip = req.headers['x-forward-for'] || req.socket.remoteAddress;
  hulkFormData = formData;
  console.log("set ip: ", ip);

  res.status(201).json({message: "Form data temporarily stored on server", url: "https://magnolia-cremations.myshopify.com/pages/plan-ahead-payment"});
});

app.get('/get-form-data', (req, res) => {
  console.log("stored ip: ", ip);
  console.log("req.headers: ", req.headers['x-forward-for']);
  console.log("req.socket: ", req.socket.remoteAddress);
  if (req.headers['x-forward-for'] === ip || req.socket.remoteAddress === ip) {
    res.json({hulkFormData: hulkFormData});
  } else {
    console.log('IP does not match');
    res.json({message: "There was an issue retrieving form data"});
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));