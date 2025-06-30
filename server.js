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

app.use(express.json());
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

  res.json({client_secret: paymentIntent.client_secret});
});

app.post('/create-checkout-session', async (req, res) => {
  const { price, email, loved_one } = req.body;
  console.log(loved_one);
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
    return_url: 'https://magnolia-cremations.myshopify.com/',
  };

  if (loved_one && loved_one !== '') {
    sessionSettings.metadata = {
      loved_one: loved_one,
    };
  }

  console.log(sessionSettings);

  const session = await stripeTest.checkout.sessions.create(sessionSettings);

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

  res.status(201).json({message: "Form data temporarily stored on server", url: "https://magnolia-cremations.myshopify.com/pages/plan-ahead-payment"});
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