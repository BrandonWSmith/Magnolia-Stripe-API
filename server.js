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
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

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
      revision: '2025-07-15',
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
      revision: '2025-07-15',
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
      revision: '2025-07-15',
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
      revision: '2025-07-15',
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

app.post('/shopify-admin-api-test-store', async (req, res) => {
  const { queryString, variables } = req.body;
  const shopify = shopifyApi({
    apiVersion: LATEST_API_VERSION,
    apiKey: 'c5bd34b79f76095c6340ad5b65b62f4d',
    apiSecretKey: '41319fc85705ae5aa3b3221fc19a31f1',
    scopes: ['write_orders', 'write_customers'],
    hostName: 'https://impact-ma-andorra-wrapped.trycloudflare.com',
    isEmbeddedApp: true,
    isCustomStoreApp: true,
    adminApiAccessToken: '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',
  });
  const sessionId = shopify.session.getOfflineId('brandon-smiths-test-store.myshopify.com');
  const session = new Session({
    id: sessionId,
    shop: 'brandon-smiths-test-store.myshopify.com',
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
  const { formData } = req.body;
  
  const getProfileUrl = `https://a.klaviyo.com/api/profiles?filter=equals%28email%2C%27${formData.contact_email}%27%29&page[size]=1`;
  const getProfileOptions = {
    method: 'GET',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-07-15',
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
    }
  };

  fetch(getProfileUrl, getProfileOptions)
    .then(response => response.json())
    .then(data => {
      if (data.data[0]) {
        const addToListUrl = 'https://a.klaviyo.com/api/lists/VD4cVf/relationships/profiles';
        const addToListOptions = {
          method: 'POST',
          headers: {
            accept: 'application/vnd.api+json',
            revision: '2025-07-15',
            'content-type': 'application/vnd.api+json',
            Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
          },
          body: `{"data":[{"type":"profile","id":"${data.data[0].id}"}]}`
        };

        fetch(addToListUrl, addToListOptions)
          .then(response => res.json({data: response.status}));
      } else {
        const createProfileUrl = 'https://a.klaviyo.com/api/profiles';
        const createProfileOptions = {
          method: 'POST',
          headers: {
            accept: 'application/vnd.api+json',
            revision: '2025-07-15',
            'content-type': 'application/vnd.api+json',
            Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
          },
          body: `{
            "data":{
              "type":"profile",
              "attributes":{
                "location":{
                  "address1":"${formData.contact_street_address}",
                  "city":"${formData.contact_city}",
                  "country":"United States",
                  "region":"${formData.contact_state}",
                  "zip":"${formData.contact_zip_code}"
                },
                "email":"${formData.contact_email}",
                "phone_number":"+1${formData.contact_phone.replaceAll("-", "")}",
                "first_name":"${formData.contact_first_name}",
                "last_name":"${formData.contact_last_name}"
              }
            }
          }`
        };

        fetch(createProfileUrl, createProfileOptions)
          .then(response => response.json())
          .then(data => {
            const addToListUrl = 'https://a.klaviyo.com/api/lists/VD4cVf/relationships/profiles';
            const addToListOptions = {
              method: 'POST',
              headers: {
                accept: 'application/vnd.api+json',
                revision: '2025-07-15',
                'content-type': 'application/vnd.api+json',
                Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
              },
              body: `{"data":[{"type":"profile","id":"${data.data.id}"}]}`
            };

            fetch(addToListUrl, addToListOptions)
              .then(response => res.json({data: response.status}));
          });
      }
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

app.post('/update-payment-intent', async (req, res) => {
  try {
    const { paymentIntentId, metadata, price } = req.body;
    
    if (!paymentIntentId || paymentIntentId === '') {
      return res.status(400).json({ error: 'Valid payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const existingMetadataKeys = Object.keys(paymentIntent.metadata || {});
    

    const metadataClear = {};
    existingMetadataKeys.forEach(key => {
      metadataClear[key] = '';
    });
    
    if (existingMetadataKeys.length > 0) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: metadataClear
      });
    }

    const updateParams = {
      metadata: metadata
    };
    
    if (price !== undefined) {
      updateParams.amount = price;
    }
    
    const updatedPaymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updateParams
    );
    
    res.json({ success: true, paymentIntent: updatedPaymentIntent });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    res.status(400).json({ error: error.message });
  }
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

app.post('/retrieve-payment-intent', async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Valid states would typically be those where payment hasn't been completed
    const validStates = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
    const isValid = validStates.includes(paymentIntent.status);
    
    if (isValid) {
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
      });
    } else {
      res.json({
        success: false,
        reason: `Payment intent is in ${paymentIntent.status} state`
      });
    }
  } catch (error) {
    console.error('Error retrieving PaymentIntent:', error);
    res.json({
      success: false,
      reason: 'Payment intent not found'
    });
  }
});

app.post('/resume-payment-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Search for Payment Intents with this email
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 50,
    });

    // Filter for pending payments that match the email
    const pendingPayments = paymentIntents.data.filter(pi => {
      const customerEmail = JSON.parse(pi.metadata.contact || '{}').email;
      return (
        (pi.status === 'requires_payment_method' || 
         pi.status === 'requires_confirmation' || 
         pi.status === 'requires_action') &&
        (pi.receipt_email === email || customerEmail === email)
      );
    });

    if (pendingPayments.length === 0) {
      return res.json([]);
    }

    // Format the response data
    const formattedPayments = pendingPayments.map(pi => {     
      return {
        paymentIntentId: pi.id,
        clientSecret: pi.client_secret,
        metadata: pi.metadata
      };
    });

    res.json(formattedPayments);
    
  } catch (error) {
    console.error('Error retrieving payments by email:', error);
    res.status(500).json({ error: 'Failed to retrieve payment information' });
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
  let event;
  try {
    event = req.body;

    if (webhookSecret) {
      const signature = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({error: 'Webhook signature verification failed', details: err.message});
  }

  const paymentIntent = event.data.object;

  if (event.type === 'payment_intent.succeeded') {
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
        'id': paymentIntent.metadata.orderId,
      }
    };

    try {
      const response = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({queryString: queryString, variables: variables}),
      });

      const data = await response.json();
      res.json({data: data, paymentIntent: paymentIntent, id: paymentIntent.metadata.orderId});
    } catch (error) {
      return res.status(500).json({error: 'Error processing payment intent succeeded', details: error.message});
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const body = `{
      "data": {
        "type": "event",
        "attributes": {
          "properties": ${JSON.stringify(paymentIntent)},
          "metric": {
            "data": {
              "type": "metric",
              "attributes": {
                "name": "Stripe Payment Failed"
              }
            }
          },
          "profile": {
            "data": {
              "type": "profile",
              "attributes": {
                "email": "hello@magnoliacremations.com"
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
        revision: '2025-07-15',
        'content-type': 'application/vnd.api+json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
      },
      body: body
    };

    try {
      const response = await fetch(url, options);
      if (response.status === 202) {
        return res.status(202).json({message: 'Payment failed event processed'});
      } else {
        const errorResponse = await response.json();
        return res.status(500).json({error: 'Error processing payment failed event', details: errorResponse});
      }
    } catch (error) {
      return res.status(500).json({error: 'Error processing payment failed event', details: error.message});
    }
  } else {
    return res.status(200).json({message: 'Event received, no action required', eventType: event.type});
  }
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

app.post('/mediciad-eligibility-request', async (req, res) => {
  const { form_data } = req.body;

  try {
    const updateConsentBody =`{
      "data": {
        "type": "profile-subscription-bulk-create-job",
        "attributes": {
          "profiles": {
            "data": [
              {
                "type": "profile",
                "attributes": {
                  "email":"${form_data.contact.email}",
                  "phone_number":"+1${form_data.contact.phone.replaceAll("-", "")}",
                  "subscriptions": {
                    "email": {
                      "marketing": {
                        "consent": "SUBSCRIBED"
                      }
                    },
                    "sms": {
                      "marketing": {
                        "consent": "SUBSCRIBED"
                      },
                      "transactional": {
                        "consent": "SUBSCRIBED"
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        "relationships": {
          "list": {
            "data": {
              "type": "list",
              "id": "VPDQdQ"
            }
          }
        }
      }
    }`;

    const updateConsentUrl = 'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs';
    const updateConsentOptions = {
      method: 'POST',
      headers: {
        accept: 'application/vnd.api+json',
        revision: '2025-07-15',
        'content-type': 'application/vnd.api+json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
      },
      body: updateConsentBody
    };

    const updateConsentResponse = await fetch(updateConsentUrl, updateConsentOptions);

    if (!updateConsentResponse.ok) {
      const updateConsentError = await updateConsentResponse.json();
      return res.status(500).json({message: 'There was an issue updating consent in Klaviyo', data: updateConsentError});
    }

    const eventBody = `{
      "data":{
        "type":"event",
        "attributes":{
          "properties":${JSON.stringify(form_data)},
          "metric":{
            "data":{
              "type":"metric",
              "attributes":{
                "name":"Medicaid Eligibility Verification Requested"
              }
            }
          },
          "profile":{
            "data":{
              "type":"profile",
              "attributes":{
                "email":"${form_data.contact.email}",
                "phone_number":"${form_data.contact.phone}",
                "first_name":"${form_data.contact.first_name}",
                "last_name":"${form_data.contact.last_name}"
              }
            }
          }
        }
      }
    }`;
    
    const eventUrl = 'https://a.klaviyo.com/api/events';
    const eventOptions = {
      method: 'POST',
      headers: {
        accept: 'application/vnd.api+json',
        revision: '2025-07-15',
        'content-type': 'application/vnd.api+json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
      },
      body: eventBody
    };

    const eventResponse = await fetch(eventUrl, eventOptions);

    if (!eventResponse.ok) {
      const eventError = await eventResponse.json();
      return res.status(500).json({message: 'There was an issue sending event to Klaviyo', data: eventError});
    }

    res.json({message: 'Event sent to Klaviyo successfully'});
  } catch (error) {
    return res.status(500).json({message: 'There was an issue sending event to Klaviyo', data: error});
  }
});

app.post('/check-medicaid-verification-password', (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.MEDICAID_VERIFICATION_PASSWORD;

  if (password === correctPassword) {
    res.json({valid: true});
  } else {
    res.json({valid: false});
  }
});

app.post('/medicaid-eligibility-approved', async (req, res) => {
  const { first_name, last_name, phone, email, urgency, caseNumber } = req.body;

  try {
    const setCustomerQueryString = `mutation customerSet($input: CustomerSetInput!, $identifier: CustomerSetIdentifiers) {
    customerSet(input: $input, identifier: $identifier) {
        customer {
          id
          firstName
          lastName
          email
          phone
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const setCustomerVariables = {
      'input': {
        'firstName': first_name,
        'lastName': last_name,
        'email': email,
        'phone': phone
      },
      'identifier': {
        'phone': phone
      }
    };

    const setCustomerResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: setCustomerQueryString, variables: setCustomerVariables}),
    });

    if (!setCustomerResponse.ok) {
      const setCustomerError = await setCustomerResponse.json();
      return res.status(500).json({message: 'There was an issue creating/updating customer in Shopify', data: setCustomerError});
    }

    const setCustomerData = await setCustomerResponse.json();

    if (setCustomerData.data?.customerSet?.userErrors?.length > 0) {
      return res.status(500).json({
        message: 'GraphQL errors in customer creation',
        data: setCustomerData.data.customerSet.userErrors
      });
    }

    if (!setCustomerData.data?.data?.customerSet?.customer?.id) {
      return res.status(500).json({
        message: 'No customer ID returned from Shopify',
        data: setCustomerData
      });
    }

    const customerId = setCustomerData.data.data.customerSet.customer.id;

    const metafieldQueryString = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          value
          namespace
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const metafieldVariables = {
      metafields: [
        {
          ownerId: customerId,
          namespace: "custom",
          key: "medicaid_case_number",
          value: caseNumber,
          type: "single_line_text_field"
        }
      ]
    };

    const metafieldResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: metafieldQueryString, variables: metafieldVariables}),
    });

    if (!metafieldResponse.ok) {
      const metafieldError = await metafieldResponse.json();
      return res.status(500).json({message: 'There was an issue creating metafield in Shopify', data: metafieldError});
    }

    const metafieldData = await metafieldResponse.json();

    if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
      return res.status(500).json({
        message: 'GraphQL errors in metafield creation',
        data: metafieldData.data.metafieldsSet.userErrors
      });
    }

    const addCustomerTagQueryString = `mutation addTags($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node {
          id
        }
        userErrors {
          message
        }
      }
    }`;

    const addCustomerTagVariables = {
      'id': customerId,
      'tags': ['Medicaid Eligible']
    };

    const addCustomerTagResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: addCustomerTagQueryString, variables: addCustomerTagVariables}),
    });

    if (!addCustomerTagResponse.ok) {
      const tagError = await addCustomerTagResponse.json();
      return res.status(500).json({message: 'There was an issue adding tag to customer in Shopify', data: tagError});
    }

    const addCustomerTagData = await addCustomerTagResponse.json();

    if (addCustomerTagData.data?.tagsAdd?.userErrors?.length > 0) {
      return res.status(500).json({
        message: 'GraphQL errors in tag addition',
        data: addCustomerTagData.data.tagsAdd.userErrors
      });
    }

    const createGiftCardQueryString = `mutation giftCardCreate($input: GiftCardCreateInput!) {
      giftCardCreate(input: $input) {
        giftCard {
          id
          expiresOn
        }
        giftCardCode
        userErrors {
          message
          field
          code
        }
      }
    }`;

    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + 30);
    const createGiftCardVariables = {
      "input": {
        "initialValue": 1200.00,
        "expiresOn": expiresOn.toISOString().split('T')[0],
        "note": `${email}`
      }
    };

    const createGiftCardResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: createGiftCardQueryString, variables: createGiftCardVariables}),
    });

    if (!createGiftCardResponse.ok) {
      const giftCardError = await createGiftCardResponse.json();
      return res.status(500).json({message: 'There was an issue creating a gift card in Shopify', data: giftCardError});
    }

    const createGiftCardData = await createGiftCardResponse.json();

    if (createGiftCardData.data?.giftCardCreate?.userErrors?.length > 0) {
      return res.status(500).json({
        message: 'GraphQL errors in gift card creation',
        data: createGiftCardData.data.giftCardCreate.userErrors
      });
    }

    const giftCardCode = createGiftCardData.data.data.giftCardCreate.giftCardCode;

    const body = `{
      "data":{
        "type":"event",
        "attributes":{
          "properties":{
            "first_name":"${first_name}",
            "last_name":"${last_name}",
            "phone_number":"${phone}",
            "email":"${email}",
            "urgnecy":"${urgency}",
            "gift_card":"${giftCardCode}"
          },
          "metric":{
            "data":{
              "type":"metric",
              "attributes":{
                "name":"Medicaid Eligibility Approved"
              }
            }
          },
          "profile":{
            "data":{
              "type":"profile",
              "attributes":{
                "email":"${email}",
                "phone_number":"${phone}",
                "first_name":"${first_name}",
                "last_name":"${last_name}"
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
        revision: '2025-07-15',
        'content-type': 'application/vnd.api+json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
      },
      body: body
    };

    const klaviyoResponse = await fetch(url, options);

    if (!klaviyoResponse.ok) {
      const klaviyoError = await klaviyoResponse.json();
      return res.status(500).json({message: 'There was an issue sending event to Klaviyo', data: klaviyoError});
    }
  } catch (error) {
    res.json({message: 'There was an issue processing the request', data: error});
  }

  res.status(202).json({message: 'Submission successful!'});
});

app.post('/medicaid-eligibility-declined', async (req, res) => {
  const { first_name, last_name, phone, email, urgency } = req.body;

  try {
    const body = `{
      "data":{
        "type":"event",
        "attributes":{
          "properties":{
            "first_name":"${first_name}",
            "last_name":"${last_name}",
            "phone_number":"${phone}",
            "email":"${email}",
            "urgnecy":"${urgency}"
          },
          "metric":{
            "data":{
              "type":"metric",
              "attributes":{
                "name":"Medicaid Eligibility Declined"
              }
            }
          },
          "profile":{
            "data":{
              "type":"profile",
              "attributes":{
                "email":"${email}",
                "phone_number":"${phone}",
                "first_name":"${first_name}",
                "last_name":"${last_name}"
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
        revision: '2025-07-15',
        'content-type': 'application/vnd.api+json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_SECRET_KEY}`
      },
      body: body
    };

    const klaviyoResponse = await fetch(url, options);

    if (!klaviyoResponse.ok) {
      const klaviyoError = await klaviyoResponse.json();
      return res.status(500).json({message: 'There was an issue sending event to Klaviyo', data: klaviyoError});
    }

    res.status(202).json({message: 'Submission successful!'});
  } catch (error) {
    return res.status(500).json({message: 'There was an issue sending event to Klaviyo', data: error});
  }
});

app.post('/add-medicaid-order-tags', async (req, res) => {
  const { orderId, customerId } = req.body;

  try {
    const getCustomerQueryString = `query {
      customer(id: "${customerId}") {
        tags
      }
    }`;

    const getCustomerResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({queryString: getCustomerQueryString}),
    });

    const getCustomerData = await getCustomerResponse.json();

    if (!getCustomerResponse.ok) {
      return res.status(500).json({
        message: 'There was an issue retrieving customer tags from Shopify', 
        data: getCustomerData
      });
    }

    const getCustomerUserErrors = getCustomerData.data?.data?.tagsAdd?.userErrors || getCustomerData.data?.tagsAdd?.userErrors;
    
    if (getCustomerUserErrors && getCustomerUserErrors.length > 0) {
      return res.status(500).json({
        message: 'GraphQL errors in retrieving customer',
        data: getCustomerUserErrors
      });
    }

    const customerTags = getCustomerData.data?.data?.customer?.tags || [];

    if (customerTags.includes('Medicaid Eligible')) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const addTagsQueryString = `mutation addTags($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          node {
            id
          }
          userErrors {
            message
          }
        }
      }`;

      const addTagsVariables = {
        'id': orderId,
        'tags': ['Medicaid', '‼️Awaiting Payment‼️']
      };

      const addTagsResponse = await fetch('https://magnolia-api.onrender.com/shopify-admin-api', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({queryString: addTagsQueryString, variables: addTagsVariables}),
      });

      const addTagsData = await addTagsResponse.json();

      if (!addTagsResponse.ok) {
        return res.status(500).json({
          message: 'There was an issue adding tag to order in Shopify', 
          data: addTagsData
        });
      }

      const addTagsUserErrors = addTagsData.data?.data?.tagsAdd?.userErrors || addTagsData.data?.tagsAdd?.userErrors;
      
      if (addTagsUserErrors && addTagsUserErrors.length > 0) {
        return res.status(500).json({
          message: 'GraphQL errors in tag addition',
          data: addTagsUserErrors
        });
      }

      res.json({message: 'Tags added successfully'});
    } else {
      res.json({message: 'Customer is not Medicaid Eligible, no tags added to order'});
    }
  } catch (error) {
    return res.status(500).json({
      message: 'There was an issue adding tag to order in Shopify', 
      error: error.message || error
    });
  }
});

app.post('/send-forms', async (req, res) => {
  const { formData } = req.body;
  const boldSignApiKey = process.env.BOLDSIGN_API_KEY;

  const witnessCremation = formData.witness_cremation_quantity > 0 ? "Selected" : "Not Selected";
  const urnDetails = formData.urn_details ? formData.urn_details.split(",") : null;
  const merchandiseDetails0 = formData.merchandise_0_details ? formData.merchandise_0_details.split(",") : null;
  const merchandiseDetails1 = formData.merchandise_1_details ? formData.merchandise_1_details.split(",") : null;
  const merchandiseDetails2 = formData.merchandise_2_details ? formData.merchandise_2_details.split(",") : null;
  const merchandiseDetails3 = formData.merchandise_3_details ? formData.merchandise_3_details.split(",") : null;
  const liability = formData.private_family_viewing_total > 0 || witnessCremation === "Selected";

  async function sendToGoogleSheet() {
    const auth = new GoogleAuth({
      keyFile: '/etc/secrets/google.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const service = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Sheet1!A2';
    const valueInputOption = 'USER_ENTERED';
    const insertDataOption = 'INSERT_ROWS';

    const createdAt = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});

    console.log(formData);
    
    const values = [
      [
        `'${createdAt}`,
        formData.service_package_type,
        formData.service_package_package_name,
        formData.urn_title,
        formData.urn_details,
        `${formData.merchandise_0_title ? `${formData.merchandise_0_title}` : ''}${formData.merchandise_1_title ? `, ${formData.merchandise_1_title} ` : ''}${formData.merchandise_2_title ? `, ${formData.merchandise_2_title}` : ''}${formData.merchandise_3_title ? `, ${formData.merchandise_3_title}` : ''}`,
        `${formData.merchandise_0_details ? `Merchandise0: ${formData.merchandise_0_details}` : ''}${formData.merchandise_1_details ? ` Merchandise1: ${formData.merchandise_1_details} ` : ''}${formData.merchandise_2_details ? ` Merchandise2: ${formData.merchandise_2_details}` : ''}${formData.merchandise_3_details ? ` Merchandise3: ${formData.merchandise_3_details}` : ''}`,
        formData.death_certificates_quantity,
        liability ? "Yes" : "No",
        formData.contact_first_name,
        formData.contact_middle_name,
        formData.contact_last_name,
        formData.contact_suffix,
        formData.contact_phone,
        formData.contact_email,
        formData.contact_street_address,
        formData.contact_city,
        formData.contact_state,
        formData.contact_zip_code,
        formData.contact_relationship,
        formData.contact_gender,
        formData.contact_age,
        formData.deceased_first_name,
        formData.deceased_middle_name,
        formData.deceased_last_name,
        formData.deceased_suffix,
        formData.deceased_phone,
        formData.deceased_email,
        formData.deceased_street_address,
        formData.deceased_city,
        formData.deceased_state,
        formData.deceased_zip_code,
        formData.deceased_date_birth,
        formData.deceased_date_death,
        formData.deceased_age,
        formData.deceased_gender,
        formData.deceased_social_security_number,
        `${formData.pick_up_location_street_address ? `${formData.pick_up_location_facility_name != '' ? `${formData.pick_up_location_facility_name} ` : ''}(${formData.pick_up_location_location_type}) ${formData.pick_up_location_street_address}, ${formData.pick_up_location_city}, ${formData.pick_up_location_state} ${formData.pick_up_location_zip_code}` : ''}`,
        `${formData.place_of_passing_street_address ? `${formData.place_of_passing_facility_name != '' ? `${formData.place_of_passing_facility_name} ` : ''}(${formData.place_of_passing_location_type}) ${formData.place_of_passing_street_address}, ${formData.place_of_passing_city}, ${formData.place_of_passing_state} ${formData.place_of_passing_zip_code}` : ''}`,
        `${formData.next_of_kin_0_full_name ? formData.next_of_kin_0_full_name : ''}`,
        `${formData.next_of_kin_0_email ? formData.next_of_kin_0_email : ''}`,
        `${formData.next_of_kin_0_phone ? formData.next_of_kin_0_phone : ''}`,
        `${formData.next_of_kin_0_relationship ? formData.next_of_kin_0_relationship : ''}`,
        `${formData.next_of_kin_0_street_address ? formData.next_of_kin_0_street_address : ''}`,
        `${formData.next_of_kin_0_city ? `${formData.next_of_kin_0_city}, ${formData.next_of_kin_0_state} ${formData.next_of_kin_0_zip_code}` : ''}`,
        `${formData.next_of_kin_1_full_name ? formData.next_of_kin_1_full_name : ''}`,
        `${formData.next_of_kin_1_email ? formData.next_of_kin_1_email : ''}`,
        `${formData.next_of_kin_1_phone ? formData.next_of_kin_1_phone : ''}`,
        `${formData.next_of_kin_1_relationship ? formData.next_of_kin_1_relationship : ''}`,
        `${formData.next_of_kin_1_street_address ? formData.next_of_kin_1_street_address : ''}`,
        `${formData.next_of_kin_1_city ? `${formData.next_of_kin_1_city}, ${formData.next_of_kin_1_state} ${formData.next_of_kin_1_zip_code}` : ''}`,
        `${formData.next_of_kin_2_full_name ? formData.next_of_kin_2_full_name : ''}`,
        `${formData.next_of_kin_2_email ? formData.next_of_kin_2_email : ''}`,
        `${formData.next_of_kin_2_phone ? formData.next_of_kin_2_phone : ''}`,
        `${formData.next_of_kin_2_relationship ? formData.next_of_kin_2_relationship : ''}`,
        `${formData.next_of_kin_2_street_address ? formData.next_of_kin_2_street_address : ''}`,
        `${formData.next_of_kin_2_city ? `${formData.next_of_kin_2_city}, ${formData.next_of_kin_2_state} ${formData.next_of_kin_2_zip_code}` : ''}`,
        `${formData.next_of_kin_3_full_name ? formData.next_of_kin_3_full_name : ''}`,
        `${formData.next_of_kin_3_email ? formData.next_of_kin_3_email : ''}`,
        `${formData.next_of_kin_3_phone ? formData.next_of_kin_3_phone : ''}`,
        `${formData.next_of_kin_3_relationship ? formData.next_of_kin_3_relationship : ''}`,
        `${formData.next_of_kin_3_street_address ? formData.next_of_kin_3_street_address : ''}`,
        `${formData.next_of_kin_3_city ? `${formData.next_of_kin_3_city}, ${formData.next_of_kin_3_state} ${formData.next_of_kin_3_zip_code}` : ''}`,
        `${formData.next_of_kin_4_full_name ? formData.next_of_kin_4_full_name : ''}`,
        `${formData.next_of_kin_4_email ? formData.next_of_kin_4_email : ''}`,
        `${formData.next_of_kin_4_phone ? formData.next_of_kin_4_phone : ''}`,
        `${formData.next_of_kin_4_relationship ? formData.next_of_kin_4_relationship : ''}`,
        `${formData.next_of_kin_4_street_address ? formData.next_of_kin_4_street_address : ''}`,
        `${formData.next_of_kin_4_city ? `${formData.next_of_kin_4_city}, ${formData.next_of_kin_4_state} ${formData.next_of_kin_4_zip_code}` : ''}`,
        formData.delivery_method,
        `${formData.shipping_address ? formData.shipping_address : ''}`,
        `${formData.private_family_viewing_total > 0 ? "Selected" : "Not Selected"}`,
        witnessCremation,
        formData.total_before_tax,
        formData.sales_tax,
        formData.total_order
      ]
    ];

    const resource = {
      values,
    }

    try {
      const results = await service.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        insertDataOption,
        resource
      });

      if (results.status != 200) {
        return res.json({message: 'There was an issue sending data to Google Sheets', data: results});
      }

      return results;
    } catch (error) {
      return res.json({message: 'There was an issue sending data to Google Sheets', data: error.message || error});
    }
  }

  const googleSheetsData = await sendToGoogleSheet();

  let nokCount = 0;
  const witnessing = `
    {
      "Id": "witnessing",
      "Value": "Yes"
    },`;
  const shipping_address = `,
    {
      "Id": "shipping_address",
      "Value": "${formData.shipping_address}"
    }`;

  if (formData.service_package_type === "Immediate Need") {
    let unusedRoleIndices = [2, 3, 4, 5, 6];
    Object.keys(formData).forEach(key => {
      switch (key) {
        case "next_of_kin_0_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 2);
          break;
        case "next_of_kin_1_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 3);
          break;
        case "next_of_kin_2_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 4);
          break;
        case "next_of_kin_3_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 5);
          break;
        case "next_of_kin_4_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 6);
          break;
        default:
          break;
      }
    });

    const nokPrefills = [];
    for (let i = 0; i < nokCount; i++) {
      const prefillData = {
        "RoleIndex": i + 2,
        "SignerName": formData[`next_of_kin_${i}_full_name`],
        "SignerOrder": i + 2,
        "SignerEmail": formData[`next_of_kin_${i}_email`],
        "SignerType": "Signer",
        "ExistingFormFields": [
          {
            "Id": `nextofkin_relationship_${i}`,
            "Value": formData[`next_of_kin_${i}_relationship`]
          }
        ]
      };
      nokPrefills.push(prefillData);
    }

    const body = `{
      "Roles": [
        {
          "RoleIndex": 1,
          "SignerName": "${formData.contact_first_name}",
          "SignerOrder": 1,
          "SignerEmail": "${formData.contact_email}",
          "SignerType": "Signer",
          "ExistingFormFields": [
            {
              "Id": "service_type",
              "Value": "${formData.service_package_type}"
            },
            {
              "Id": "service_package",
              "Value": "${formData.service_package_package_name}"
            },
            {
              "Id": "service_package_price",
              "Value": "$${formData.service_package_price}"
            },
            {
              "Id": "urn_title",
              "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
            },
            {
              "Id": "urn_details",
              "Value": "${urnDetails ? `${urnDetails.length > 0 ? urnDetails[0] : ''}
      ${urnDetails.length > 1 ? urnDetails[1] : ''}   ${urnDetails.length > 2 ? urnDetails[2] : ''}
      ${urnDetails.length > 3 ? urnDetails[3] : ''}   ${urnDetails.length > 4 ? urnDetails[4] : ''}` : ''}"
            },
            {
              "Id": "urn_price",
              "Value": "${formData.urn_price ? `$${formData.urn_price}` : ''}"
            },
            {
              "Id": "merchandise_title_0",
              "Value": "${formData.merchandise_0_title ? `${formData.merchandise_0_title} x ${formData.merchandise_0_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_0",
              "Value": "${merchandiseDetails0 ? `${merchandiseDetails0.length > 0 ? merchandiseDetails0[0] : ''}
      ${merchandiseDetails0.length > 1 ? merchandiseDetails0[1] : ''}   ${merchandiseDetails0.length > 2 ? merchandiseDetails0[2] : ''}
      ${merchandiseDetails0.length > 3 ? merchandiseDetails0[3] : ''}   ${merchandiseDetails0.length > 4 ? merchandiseDetails0[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_0",
              "Value": "${formData.merchandise_0_total ? `$${formData.merchandise_0_total}` : ''}"
            },
            {
              "Id": "merchandise_title_1",
              "Value": "${formData.merchandise_1_title ? `${formData.merchandise_1_title} x ${formData.merchandise_1_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_1",
              "Value": "${merchandiseDetails1 ? `${merchandiseDetails1.length > 0 ? merchandiseDetails1[0] : ''}
      ${merchandiseDetails1.length > 1 ? merchandiseDetails1[1] : ''}   ${merchandiseDetails1.length > 2 ? merchandiseDetails1[2] : ''}
      ${merchandiseDetails1.length > 3 ? merchandiseDetails1[3] : ''}   ${merchandiseDetails1.length > 4 ? merchandiseDetails1[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_1",
              "Value": "${formData.merchandise_1_total ? `$${formData.merchandise_1_total}` : ''}"
            },
            {
              "Id": "merchandise_title_2",
              "Value": "${formData.merchandise_2_title ? `${formData.merchandise_2_title} x ${formData.merchandise_2_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_2",
              "Value": "${merchandiseDetails2 ? `${merchandiseDetails2.length > 0 ? merchandiseDetails2[0] : ''}
      ${merchandiseDetails2.length > 1 ? merchandiseDetails2[1] : ''}   ${merchandiseDetails2.length > 2 ? merchandiseDetails2[2] : ''}
      ${merchandiseDetails2.length > 3 ? merchandiseDetails2[3] : ''}   ${merchandiseDetails2.length > 4 ? merchandiseDetails2[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_2",
              "Value": "${formData.merchandise_2_total ? `$${formData.merchandise_2_total}` : ''}"
            },
            {
              "Id": "merchandise_title_3",
              "Value": "${formData.merchandise_3_title ? `${formData.merchandise_3_title} x ${formData.merchandise_3_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_3",
              "Value": "${merchandiseDetails3 ? `${merchandiseDetails3.length > 0 ? merchandiseDetails3[0] : ''}
      ${merchandiseDetails3.length > 1 ? merchandiseDetails3[1] : ''}   ${merchandiseDetails3.length > 2 ? merchandiseDetails3[2] : ''}
      ${merchandiseDetails3.length > 3 ? merchandiseDetails3[3] : ''}   ${merchandiseDetails3.length > 4 ? merchandiseDetails3[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_3",
              "Value": "${formData.merchandise_3_total ? `$${formData.merchandise_3_total}` : ''}"
            },
            {
              "Id": "witness_price",
              "Value": "${witnessCremation}"
            },
            {
              "Id": "private_viewing_price", 
              "Value": "$${formData.private_family_viewing_total}"
            },
            {
              "Id": "transfer_price",
              "Value": "$${formData.transfer_fee_price}"
            },
            {
              "Id": "death_certificate_qty", 
              "Value": "${formData.death_certificates_quantity}"
            },
            {
              "Id": "death_certificate_price",
              "Value": "$${formData.death_certificates_total}"
            },
            {
              "Id": "shipping",
              "Value": "$${formData.shipping}"
            },
            {
              "Id": "total_before_tax",
              "Value": "$${formData.total_before_tax}"
            },
            {
              "Id": "sale_tax",
              "Value": "$${formData.sales_tax}"
            },
            {
              "Id": "total",
              "Value": "$${formData.total_order}"
            },
            {
              "Id": "purchaser_first_name",
              "Value": "${formData.purchaser_first_name}"
            },
            {
              "Id": "purchaser_middle_name",
              "Value": "${formData.purchaser_middle_name}"
            },
            {
              "Id": "purchaser_last_name",
              "Value": "${formData.purchaser_last_name}"
            },
            {
              "Id": "purchaser_suffix",
              "Value": "${formData.purchaser_suffix}"
            },
            {
              "Id": "purchaser_relationship",
              "Value": "${formData.purchaser_relationship}"
            },
            {
              "Id": "purchaser_phone",
              "Value": "${formData.purchaser_phone}"
            },
            {
              "Id": "purchaser_address",
              "Value": "${formData.purchaser_street_address}, ${formData.purchaser_city}, ${formData.purchaser_state} ${formData.purchaser_zip_code}"
            },
            {
              "Id": "purchaser_email",
              "Value": "${formData.purchaser_email}"
            },
            {
              "Id": "deceased_first_name",
              "Value": "${formData.deceased_first_name}"
            },
            {
              "Id": "deceased_middle_name",
              "Value": "${formData.deceased_middle_name}"
            },
            {
              "Id": "deceased_last_name",
              "Value": "${formData.deceased_last_name}"
            },
            {
              "Id": "deceased_suffix",
              "Value": "${formData.deceased_suffix}"
            },
            {
              "Id": "deceased_gender",
              "Value": "${formData.deceased_gender}"
            },
            {
              "Id": "deceased_age",
              "Value": "${formData.deceased_age}"
            },
            {
              "Id": "deceased_birth",
              "Value": "${formData.deceased_date_birth}"
            },
            {
              "Id": "deceased_death",
              "Value": "${formData.deceased_date_death}"
            },
            {
              "Id": "deceased_address",
              "Value": "${formData.deceased_street_address}, ${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
            },
            {
              "Id": "pickuplocation",
              "Value": "${formData.pick_up_location_facility_name != '' ? `${formData.pick_up_location_facility_name} ` : ''}(${formData.pick_up_location_location_type}) ${formData.pick_up_location_street_address}, ${formData.pick_up_location_city}, ${formData.pick_up_location_state} ${formData.pick_up_location_zip_code}"
            },
            {
              "Id": "license",
              "Value": "${formData.license}"
            },
            {
              "Id": "contact_full_name",
              "Value": "${formData.contact_first_name}${formData.contact_middle_name != '' ? ` ${formData.contact_middle_name}` : ''} ${formData.contact_last_name}${formData.contact_suffix != '' ? ` ${formData.contact_suffix}` : ''}"
            },
            {
              "Id": "contact_phone",
              "Value": "${formData.contact_phone}"
            },
            {
              "Id": "contact_email",
              "Value": "${formData.contact_email}"
            },
            {
              "Id": "contact_address",
              "Value": "${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
            },
            {
              "Id": "nextofkin_name_0",
              "Value": "${formData.next_of_kin_0_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_0",
              "Value": "${formData.next_of_kin_0_phone || ''}"
            },
            {
              "Id": "nextofkin_email_0",
              "Value": "${formData.next_of_kin_0_email || ''}"
            },
            {
              "Id": "nextofkin_address_0",
              "Value": "${formData.next_of_kin_0_street_address ? `${formData.next_of_kin_0_street_address}, ${formData.next_of_kin_0_city}, ${formData.next_of_kin_0_state} ${formData.next_of_kin_0_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_1",
              "Value": "${formData.next_of_kin_1_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_1",
              "Value": "${formData.next_of_kin_1_phone || ''}"
            },
            {
              "Id": "nextofkin_email_1",
              "Value": "${formData.next_of_kin_1_email || ''}"
            },
            {
              "Id": "nextofkin_address_1",
              "Value": "${formData.next_of_kin_1_street_address ? `${formData.next_of_kin_1_street_address}, ${formData.next_of_kin_1_city}, ${formData.next_of_kin_1_state} ${formData.next_of_kin_1_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_2",
              "Value": "${formData.next_of_kin_2_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_2",
              "Value": "${formData.next_of_kin_2_phone || ''}"
            },
            {
              "Id": "nextofkin_email_2", 
              "Value": "${formData.next_of_kin_2_email || ''}"
            },
            {
              "Id": "nextofkin_address_2",
              "Value": "${formData.next_of_kin_2_street_address ? `${formData.next_of_kin_2_street_address}, ${formData.next_of_kin_2_city}, ${formData.next_of_kin_2_state} ${formData.next_of_kin_2_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_3",
              "Value": "${formData.next_of_kin_3_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_3",
              "Value": "${formData.next_of_kin_3_phone || ''}"
            },
            {
              "Id": "nextofkin_email_3",
              "Value": "${formData.next_of_kin_3_email || ''}"
            },
            {
              "Id": "nextofkin_address_3",
              "Value": "${formData.next_of_kin_3_street_address ? `${formData.next_of_kin_3_street_address}, ${formData.next_of_kin_3_city}, ${formData.next_of_kin_3_state} ${formData.next_of_kin_3_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_4",
              "Value": "${formData.next_of_kin_4_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_4",
              "Value": "${formData.next_of_kin_4_phone || ''}"
            },
            {
              "Id": "nextofkin_email_4",
              "Value": "${formData.next_of_kin_4_email || ''}"
            },
            {
              "Id": "nextofkin_address_4",
              "Value": "${formData.next_of_kin_4_street_address ? `${formData.next_of_kin_4_street_address}, ${formData.next_of_kin_4_city}, ${formData.next_of_kin_4_state} ${formData.next_of_kin_4_zip_code}` : ''}"
            },
            {
              "Id": "deceased_gender_1",
              "Value": "${formData.deceased_gender}"
            },
            {
              "Id": "deceased_ssn",
              "Value": "${formData.deceased_social_security_number}"
            },
            {
              "Id": "deceased_place_of_death",
              "Value": "${formData.place_of_passing_city}, ${formData.place_of_passing_state}"
            },
            {
              "Id": "deceased_street_address",
              "Value": "${formData.deceased_street_address}"
            },
            {
              "Id": "deceased_city",
              "Value": "${formData.deceased_city}"
            },
            {
              "Id": "deceased_state",
              "Value": "${formData.deceased_state}"
            },
            {
              "Id": "deceased_zip",
              "Value": "${formData.deceased_zip_code}"
            },
            {
              "Id": "contact_street_address",
              "Value": "${formData.contact_street_address}"
            },
            {
              "Id": "contact_city_state_zip",
              "Value": "${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
            },
            {
              "Id": "contact_relationship",
              "Value": "${formData.contact_relationship}"
            },
            {
              "Id": "deceased_full_name",
              "Value": "${formData.deceased_first_name}${formData.deceased_middle_name != '' ? ` ${formData.deceased_middle_name}` : ''} ${formData.deceased_last_name}${formData.deceased_suffix != '' ? ` ${formData.deceased_suffix}` : ''}"
            },
            {
              "Id": "deceased_gender_2",
              "Value": "${formData.deceased_gender}"
            },${witnessCremation === 'Selected' || formData.private_family_viewing_total > 0 ? witnessing : ''}
            {
              "Id": "cremation_time",
              "Value": "${witnessCremation === 'Selected' || formData.private_family_viewing_total > 0 ? 'Specified' : 'Unspecified'}"
            },
            {
              "Id": "shipping_check",
              "Value": "${formData.delivery_method}"
            }${formData.delivery_method === 'Delivery' ? shipping_address : ''}
          ]
        },
        ${nokPrefills.length > 0 ? `${nokPrefills.map(role => JSON.stringify(role))},` : ''}{
          "RoleIndex": ${2 + nokCount},
          "SignerName": "Magnolia Cremations",
          "SignerOrder": ${2 + nokCount},
          "SignerEmail": "orders@magnoliacremations.com",
          "SignerType": "Signer",
          "ExistingFormFields": [
            {
              "Id": "deceased_death_2",
              "Value": "${formData.deceased_date_death}"
            },
            {
              "Id": "deceased_place_of_death_full",
              "Value": "${formData.place_of_passing_facility_name != '' ? `${formData.place_of_passing_facility_name} ` : ''}(${formData.place_of_passing_location_type}) ${formData.place_of_passing_street_address}, ${formData.place_of_passing_city}, ${formData.place_of_passing_state} ${formData.place_of_passing_zip_code}"
            }
          ]
        }
      ],
      "RoleRemovalIndices": [${unusedRoleIndices}]
    }`;
    
    if (liability) {
      try {
        const response = await fetch("https://api.boldsign.com/v1/template/send?templateId=8bcbdc10-3630-4a14-8884-1b96480ca07c", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: body
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json({message: 'There was an issue sending forms', data: data, body: body});
        }

        res.json({message: 'Forms sent successfully'});
      } catch (error) {
        return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error, body: body});
      }
    } else {
      try {
        const response = await fetch("https://api.boldsign.com/v1/template/send?templateId=a49e2fce-576f-4198-a31e-c41acb80e60e", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: body
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json({message: 'There was an issue sending forms', data: data, body: body});
        }

        res.json({message: 'Forms sent successfully'});
      } catch (error) {
        return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error, body: body});
      }
    }
  } else if (formData.service_package_type === "Passing Soon") {
    const sgsAndVitalBody = `{
      "Roles": [
        {
          "RoleIndex": 1,
          "SignerName": "${formData.contact_first_name}",
          "SignerOrder": 1,
          "SignerEmail": "${formData.contact_email}",
          "SignerType": "Signer",
          "ExistingFormFields": [
            {
              "Id": "service_type",
              "Value": "${formData.service_package_type}"
            },
            {
              "Id": "service_package",
              "Value": "${formData.service_package_package_name}"
            },
            {
              "Id": "service_package_price",
              "Value": "$${formData.service_package_price}"
            },
            {
              "Id": "urn_title",
              "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
            },
            {
              "Id": "urn_details",
              "Value": "${urnDetails ? `${urnDetails.length > 0 ? urnDetails[0] : ''}
      ${urnDetails.length > 1 ? urnDetails[1] : ''}   ${urnDetails.length > 2 ? urnDetails[2] : ''}
      ${urnDetails.length > 3 ? urnDetails[3] : ''}   ${urnDetails.length > 4 ? urnDetails[4] : ''}` : ''}"
            },
            {
              "Id": "urn_price",
              "Value": "${formData.urn_price ? `$${formData.urn_price}` : ''}"
            },
            {
              "Id": "merchandise_title_0",
              "Value": "${formData.merchandise_0_title ? `${formData.merchandise_0_title} x ${formData.merchandise_0_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_0",
              "Value": "${merchandiseDetails0 ? `${merchandiseDetails0.length > 0 ? merchandiseDetails0[0] : ''}
      ${merchandiseDetails0.length > 1 ? merchandiseDetails0[1] : ''}   ${merchandiseDetails0.length > 2 ? merchandiseDetails0[2] : ''}
      ${merchandiseDetails0.length > 3 ? merchandiseDetails0[3] : ''}   ${merchandiseDetails0.length > 4 ? merchandiseDetails0[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_0",
              "Value": "${formData.merchandise_0_total ? `$${formData.merchandise_0_total}` : ''}"
            },
            {
              "Id": "merchandise_title_1",
              "Value": "${formData.merchandise_1_title ? `${formData.merchandise_1_title} x ${formData.merchandise_1_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_1",
              "Value": "${merchandiseDetails1 ? `${merchandiseDetails1.length > 0 ? merchandiseDetails1[0] : ''}
      ${merchandiseDetails1.length > 1 ? merchandiseDetails1[1] : ''}   ${merchandiseDetails1.length > 2 ? merchandiseDetails1[2] : ''}
      ${merchandiseDetails1.length > 3 ? merchandiseDetails1[3] : ''}   ${merchandiseDetails1.length > 4 ? merchandiseDetails1[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_1",
              "Value": "${formData.merchandise_1_total ? `$${formData.merchandise_1_total}` : ''}"
            },
            {
              "Id": "merchandise_title_2",
              "Value": "${formData.merchandise_2_title ? `${formData.merchandise_2_title} x ${formData.merchandise_2_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_2",
              "Value": "${merchandiseDetails2 ? `${merchandiseDetails2.length > 0 ? merchandiseDetails2[0] : ''}
      ${merchandiseDetails2.length > 1 ? merchandiseDetails2[1] : ''}   ${merchandiseDetails2.length > 2 ? merchandiseDetails2[2] : ''}
      ${merchandiseDetails2.length > 3 ? merchandiseDetails2[3] : ''}   ${merchandiseDetails2.length > 4 ? merchandiseDetails2[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_2",
              "Value": "${formData.merchandise_2_total ? `$${formData.merchandise_2_total}` : ''}"
            },
            {
              "Id": "merchandise_title_3",
              "Value": "${formData.merchandise_3_title ? `${formData.merchandise_3_title} x ${formData.merchandise_3_quantity}` : ''}"
            },
            {
              "Id": "merchandise_details_3",
              "Value": "${merchandiseDetails3 ? `${merchandiseDetails3.length > 0 ? merchandiseDetails3[0] : ''}
      ${merchandiseDetails3.length > 1 ? merchandiseDetails3[1] : ''}   ${merchandiseDetails3.length > 2 ? merchandiseDetails3[2] : ''}
      ${merchandiseDetails3.length > 3 ? merchandiseDetails3[3] : ''}   ${merchandiseDetails3.length > 4 ? merchandiseDetails3[4] : ''}` : ''}"
            },
            {
              "Id": "merchandise_price_3",
              "Value": "${formData.merchandise_3_total ? `$${formData.merchandise_3_total}` : ''}"
            },
            {
              "Id": "witness_price",
              "Value": "${witnessCremation}"
            },
            {
              "Id": "private_viewing_price", 
              "Value": "$${formData.private_family_viewing_total}"
            },
            {
              "Id": "transfer_price",
              "Value": "$${formData.transfer_fee_price}"
            },
            {
              "Id": "death_certificate_qty", 
              "Value": "${formData.death_certificates_quantity}"
            },
            {
              "Id": "death_certificate_price",
              "Value": "$${formData.death_certificates_total}"
            },
            {
              "Id": "shipping",
              "Value": "$${formData.shipping}"
            },
            {
              "Id": "total_before_tax",
              "Value": "$${formData.total_before_tax}"
            },
            {
              "Id": "sale_tax",
              "Value": "$${formData.sales_tax}"
            },
            {
              "Id": "total",
              "Value": "$${formData.total_order}"
            },
            {
              "Id": "purchaser_first_name",
              "Value": "${formData.purchaser_first_name}"
            },
            {
              "Id": "purchaser_middle_name",
              "Value": "${formData.purchaser_middle_name}"
            },
            {
              "Id": "purchaser_last_name",
              "Value": "${formData.purchaser_last_name}"
            },
            {
              "Id": "purchaser_suffix",
              "Value": "${formData.purchaser_suffix}"
            },
            {
              "Id": "purchaser_relationship",
              "Value": "${formData.purchaser_relationship}"
            },
            {
              "Id": "purchaser_phone",
              "Value": "${formData.purchaser_phone}"
            },
            {
              "Id": "purchaser_address",
              "Value": "${formData.purchaser_street_address}, ${formData.purchaser_city}, ${formData.purchaser_state} ${formData.purchaser_zip_code}"
            },
            {
              "Id": "purchaser_email",
              "Value": "${formData.purchaser_email}"
            },
            {
              "Id": "deceased_first_name",
              "Value": "${formData.deceased_first_name}"
            },
            {
              "Id": "deceased_middle_name",
              "Value": "${formData.deceased_middle_name}"
            },
            {
              "Id": "deceased_last_name",
              "Value": "${formData.deceased_last_name}"
            },
            {
              "Id": "deceased_suffix",
              "Value": "${formData.deceased_suffix}"
            },
            {
              "Id": "deceased_gender",
              "Value": "${formData.deceased_gender}"
            },
            {
              "Id": "deceased_birth",
              "Value": "${formData.deceased_date_birth}"
            },
            {
              "Id": "deceased_address",
              "Value": "${formData.deceased_street_address}, ${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
            },
            {
              "Id": "pickuplocation",
              "Value": "${formData.pick_up_location_facility_name != '' ? `${formData.pick_up_location_facility_name} ` : ''}(${formData.pick_up_location_location_type}) ${formData.pick_up_location_street_address}, ${formData.pick_up_location_city}, ${formData.pick_up_location_state} ${formData.pick_up_location_zip_code}"
            },
            {
              "Id": "license",
              "Value": "${formData.license}"
            },
            {
              "Id": "contact_full_name",
              "Value": "${formData.contact_first_name}${formData.contact_middle_name != '' ? ` ${formData.contact_middle_name}` : ''} ${formData.contact_last_name}${formData.contact_suffix != '' ? ` ${formData.contact_suffix}` : ''}"
            },
            {
              "Id": "contact_phone",
              "Value": "${formData.contact_phone}"
            },
            {
              "Id": "contact_email",
              "Value": "${formData.contact_email}"
            },
            {
              "Id": "contact_address",
              "Value": "${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
            },
            {
              "Id": "nextofkin_name_0",
              "Value": "${formData.next_of_kin_0_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_0",
              "Value": "${formData.next_of_kin_0_phone || ''}"
            },
            {
              "Id": "nextofkin_email_0",
              "Value": "${formData.next_of_kin_0_email || ''}"
            },
            {
              "Id": "nextofkin_address_0",
              "Value": "${formData.next_of_kin_0_street_address ? `${formData.next_of_kin_0_street_address}, ${formData.next_of_kin_0_city}, ${formData.next_of_kin_0_state} ${formData.next_of_kin_0_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_1",
              "Value": "${formData.next_of_kin_1_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_1",
              "Value": "${formData.next_of_kin_1_phone || ''}"
            },
            {
              "Id": "nextofkin_email_1",
              "Value": "${formData.next_of_kin_1_email || ''}"
            },
            {
              "Id": "nextofkin_address_1",
              "Value": "${formData.next_of_kin_1_street_address ? `${formData.next_of_kin_1_street_address}, ${formData.next_of_kin_1_city}, ${formData.next_of_kin_1_state} ${formData.next_of_kin_1_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_2",
              "Value": "${formData.next_of_kin_2_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_2",
              "Value": "${formData.next_of_kin_2_phone || ''}"
            },
            {
              "Id": "nextofkin_email_2", 
              "Value": "${formData.next_of_kin_2_email || ''}"
            },
            {
              "Id": "nextofkin_address_2",
              "Value": "${formData.next_of_kin_2_street_address ? `${formData.next_of_kin_2_street_address}, ${formData.next_of_kin_2_city}, ${formData.next_of_kin_2_state} ${formData.next_of_kin_2_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_3",
              "Value": "${formData.next_of_kin_3_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_3",
              "Value": "${formData.next_of_kin_3_phone || ''}"
            },
            {
              "Id": "nextofkin_email_3",
              "Value": "${formData.next_of_kin_3_email || ''}"
            },
            {
              "Id": "nextofkin_address_3",
              "Value": "${formData.next_of_kin_3_street_address ? `${formData.next_of_kin_3_street_address}, ${formData.next_of_kin_3_city}, ${formData.next_of_kin_3_state} ${formData.next_of_kin_3_zip_code}` : ''}"
            },
            {
              "Id": "nextofkin_name_4",
              "Value": "${formData.next_of_kin_4_full_name || ''}"
            },
            {
              "Id": "nextofkin_phone_4",
              "Value": "${formData.next_of_kin_4_phone || ''}"
            },
            {
              "Id": "nextofkin_email_4",
              "Value": "${formData.next_of_kin_4_email || ''}"
            },
            {
              "Id": "nextofkin_address_4",
              "Value": "${formData.next_of_kin_4_street_address ? `${formData.next_of_kin_4_street_address}, ${formData.next_of_kin_4_city}, ${formData.next_of_kin_4_state} ${formData.next_of_kin_4_zip_code}` : ''}"
            },
            {
              "Id": "deceased_gender_1",
              "Value": "${formData.deceased_gender}"
            },
            {
              "Id": "deceased_ssn",
              "Value": "${formData.deceased_social_security_number}"
            },
            {
              "Id": "deceased_street_address",
              "Value": "${formData.deceased_street_address}"
            },
            {
              "Id": "deceased_city",
              "Value": "${formData.deceased_city}"
            },
            {
              "Id": "deceased_state",
              "Value": "${formData.deceased_state}"
            },
            {
              "Id": "deceased_zip",
              "Value": "${formData.deceased_zip_code}"
            },
            {
              "Id": "contact_street_address",
              "Value": "${formData.contact_street_address}"
            },
            {
              "Id": "contact_city_state_zip",
              "Value": "${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
            },
            {
              "Id": "contact_relationship",
              "Value": "${formData.contact_relationship}"
            }${liability ? `,
              {
                "Id": "deceased_full_name",
                "Value": "${formData.deceased_first_name}${formData.deceased_middle_name != '' ? ` ${formData.deceased_middle_name}` : ''} ${formData.deceased_last_name}${formData.deceased_suffix != '' ? ` ${formData.deceased_suffix}` : ''}"
              }` : ''}
          ]
        }
      ]
    }`;

    let unusedRoleIndices = [3, 4, 5, 6, 7];
    Object.keys(formData).forEach(key => {
      switch (key) {
        case "next_of_kin_0_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 3);
          break;
        case "next_of_kin_1_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 4);
          break;
        case "next_of_kin_2_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 5);
          break;
        case "next_of_kin_3_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 6);
          break;
        case "next_of_kin_4_email":
          nokCount++;
          unusedRoleIndices = unusedRoleIndices.filter(index => index != 7);
          break;
        default:
          break;
      }
    });

    const nokPrefills = [];
    for (let i = 0; i < nokCount; i++) {
      const prefillData = {
        "RoleIndex": i + 3,
        "SignerName": formData[`next_of_kin_${i}_full_name`],
        "SignerOrder": i + 3,
        "SignerEmail": formData[`next_of_kin_${i}_email`],
        "SignerType": "Signer",
        "ExistingFormFields": [
          {
            "Id": `nextofkin_name_${i}`,
            "Value": formData[`next_of_kin_${i}_full_name`]
          },
          {
            "Id": `nextofkin_relationship_${i}`,
            "Value": formData[`next_of_kin_${i}_relationship`]
          }
        ]
      };
      nokPrefills.push(prefillData);
    }

    const cremAuthBody = `{
      "Roles": [
         {
          "RoleIndex": 1,
          "SignerName": "Magnolia Cremations",
          "SignerOrder": 1,
          "SignerEmail": "orders@magnoliacremations.com",
          "SignerType": "Signer"
        },
        {
          "RoleIndex": 2,
          "SignerName": "${formData.contact_first_name}",
          "SignerOrder": 2,
          "SignerEmail": "${formData.contact_email}",
          "SignerType": "Signer",
          "ExistingFormFields": [
            {
              "Id": "deceased_full_name",
              "Value": "${formData.deceased_first_name}${formData.deceased_middle_name != '' ? ` ${formData.deceased_middle_name}` : ''} ${formData.deceased_last_name}${formData.deceased_suffix != '' ? ` ${formData.deceased_suffix}` : ''}"
            },
            {
              "Id": "deceased_gender",
              "Value": "${formData.deceased_gender}"
            },
            {
              "Id": "deceased_birth",
              "Value": "${formData.deceased_date_birth}"
            },
            {
              "Id": "urn_title",
              "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
            },
            {
              "Id": "contact_full_name",
              "Value": "${formData.contact_first_name}${formData.contact_middle_name != '' ? ` ${formData.contact_middle_name}` : ''} ${formData.contact_last_name}${formData.contact_suffix != '' ? ` ${formData.contact_suffix}` : ''}"
            },
            {
              "Id": "contact_relationship",
              "Value": "${formData.contact_relationship}"
            },${witnessCremation === 'Selected' || formData.private_family_viewing_total > 0 ? witnessing : ''}
            {
              "Id": "cremation_time",
              "Value": "${witnessCremation === 'Selected' || formData.private_family_viewing_total > 0 ? 'Specified' : 'Unspecified'}"
            },
            {
              "Id": "shipping_check",
              "Value": "${formData.delivery_method}"
            }${formData.delivery_method === 'Delivery' ? shipping_address : ''}
          ]
        }${nokPrefills.length > 0 ? `,
          ${nokPrefills.map(role => JSON.stringify(role))}` : ''}
      ],
      "RoleRemovalIndices": [${unusedRoleIndices}]
    }`;

    if (liability) {
      try {
        const sgsAndVitalResponse = await fetch("https://api.boldsign.com/v1/template/send?templateId=fca14583-fc27-401a-af74-2e9e8b3f02af", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: sgsAndVitalBody
        });

        const sgsAndVitalData = await sgsAndVitalResponse.json();

        if (!sgsAndVitalResponse.ok) {
          return res.status(sgsAndVitalResponse.status).json({message: 'There was an issue sending SG&S/Vital forms', data: sgsAndVitalData, body: sgsAndVitalBody});
        }

        const cremAuthResponse = await fetch("https://api.boldsign.com/v1/template/send?templateId=886f8e77-1140-4efb-aab5-c554fbb4f65a", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: cremAuthBody
        });

        const cremAuthData = await cremAuthResponse.json();

        if (!cremAuthResponse.ok) {
          return res.status(cremAuthResponse.status).json({message: 'There was an issue sending Cremation Auth forms', data: cremAuthData, body: cremAuthBody});
        }

        res.json({message: 'Forms sent successfully'});
      } catch (error) {
        return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error});
      }
    } else {
      try {
        const sgsAndVitalResponse = await fetch("https://api.boldsign.com/v1/template/send?templateId=8c83f1c7-b40f-47d4-a03d-5b530b6bb0ae", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: sgsAndVitalBody
        });

        const sgsAndVitalData = await sgsAndVitalResponse.json();

        if (!sgsAndVitalResponse.ok) {
          return res.status(sgsAndVitalResponse.status).json({message: 'There was an issue sending SG&S/Vital forms', data: sgsAndVitalData, body: sgsAndVitalBody});
        }

        const cremAuthResponse = await fetch("https://api.boldsign.com/v1/template/send?templateId=23932329-d871-412c-98b6-492d57aabf88", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: cremAuthBody
        });

        const cremAuthData = await cremAuthResponse.json();

        if (!cremAuthResponse.ok) {
          return res.status(cremAuthResponse.status).json({message: 'There was an issue sending Cremation Auth forms', data: cremAuthData, body: cremAuthBody});
        }

        res.json({message: 'Forms sent successfully'});
      } catch (error) {
        return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error});
      }
    }
  } else if (formData.service_package_type === "Planning Ahead") {
    if (formData.deceased_state === "Indiana") {
      const body = `{
        "Roles": [
          {
            "RoleIndex": 1,
            "SignerName": "${formData.contact_first_name}",
            "SignerOrder": 1,
            "SignerEmail": "${formData.contact_email}",
            "SignerType": "Signer",
            "ExistingFormFields": [
              {
                "Id": "service_type",
                "Value": "${formData.service_package_type}"
              },
              {
                "Id": "service_package",
                "Value": "${formData.service_package_package_name}"
              },
              {
                "Id": "service_package_price",
                "Value": "$${formData.service_package_price}"
              },
              {
                "Id": "urn_title",
                "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
              },
              {
                "Id": "urn_details",
                "Value": "${urnDetails ? `${urnDetails.length > 0 ? urnDetails[0] : ''}
        ${urnDetails.length > 1 ? urnDetails[1] : ''}   ${urnDetails.length > 2 ? urnDetails[2] : ''}
        ${urnDetails.length > 3 ? urnDetails[3] : ''}   ${urnDetails.length > 4 ? urnDetails[4] : ''}` : ''}"
              },
              {
                "Id": "urn_price",
                "Value": "${formData.urn_price ? `$${formData.urn_price}` : ''}"
              },
              {
                "Id": "merchandise_title_0",
                "Value": "${formData.merchandise_0_title ? `${formData.merchandise_0_title} x ${formData.merchandise_0_quantity}` : ''}"
              },
              {
                "Id": "merchandise_details_0",
                "Value": "${merchandiseDetails0 ? `${merchandiseDetails0.length > 0 ? merchandiseDetails0[0] : ''}
        ${merchandiseDetails0.length > 1 ? merchandiseDetails0[1] : ''}   ${merchandiseDetails0.length > 2 ? merchandiseDetails0[2] : ''}
        ${merchandiseDetails0.length > 3 ? merchandiseDetails0[3] : ''}   ${merchandiseDetails0.length > 4 ? merchandiseDetails0[4] : ''}` : ''}"
              },
              {
                "Id": "merchandise_price_0",
                "Value": "${formData.merchandise_0_total ? `$${formData.merchandise_0_total}` : ''}"
              },
              {
                "Id": "merchandise_title_1",
                "Value": "${formData.merchandise_1_title ? `${formData.merchandise_1_title} x ${formData.merchandise_1_quantity}` : ''}"
              },
              {
                "Id": "merchandise_details_1",
                "Value": "${merchandiseDetails1 ? `${merchandiseDetails1.length > 0 ? merchandiseDetails1[0] : ''}
        ${merchandiseDetails1.length > 1 ? merchandiseDetails1[1] : ''}   ${merchandiseDetails1.length > 2 ? merchandiseDetails1[2] : ''}
        ${merchandiseDetails1.length > 3 ? merchandiseDetails1[3] : ''}   ${merchandiseDetails1.length > 4 ? merchandiseDetails1[4] : ''}` : ''}"
              },
              {
                "Id": "merchandise_price_1",
                "Value": "${formData.merchandise_1_total ? `$${formData.merchandise_1_total}` : ''}"
              },
              {
                "Id": "merchandise_title_2",
                "Value": "${formData.merchandise_2_title ? `${formData.merchandise_2_title} x ${formData.merchandise_2_quantity}` : ''}"
              },
              {
                "Id": "merchandise_details_2",
                "Value": "${merchandiseDetails2 ? `${merchandiseDetails2.length > 0 ? merchandiseDetails2[0] : ''}
        ${merchandiseDetails2.length > 1 ? merchandiseDetails2[1] : ''}   ${merchandiseDetails2.length > 2 ? merchandiseDetails2[2] : ''}
        ${merchandiseDetails2.length > 3 ? merchandiseDetails2[3] : ''}   ${merchandiseDetails2.length > 4 ? merchandiseDetails2[4] : ''}` : ''}"
              },
              {
                "Id": "merchandise_price_2",
                "Value": "${formData.merchandise_2_total ? `$${formData.merchandise_2_total}` : ''}"
              },
              {
                "Id": "merchandise_title_3",
                "Value": "${formData.merchandise_3_title ? `${formData.merchandise_3_title} x ${formData.merchandise_3_quantity}` : ''}"
              },
              {
                "Id": "merchandise_details_3",
                "Value": "${merchandiseDetails3 ? `${merchandiseDetails3.length > 0 ? merchandiseDetails3[0] : ''}
        ${merchandiseDetails3.length > 1 ? merchandiseDetails3[1] : ''}   ${merchandiseDetails3.length > 2 ? merchandiseDetails3[2] : ''}
        ${merchandiseDetails3.length > 3 ? merchandiseDetails3[3] : ''}   ${merchandiseDetails3.length > 4 ? merchandiseDetails3[4] : ''}` : ''}"
              },
              {
                "Id": "merchandise_price_3",
                "Value": "${formData.merchandise_3_total ? `$${formData.merchandise_3_total}` : ''}"
              },
              {
                "Id": "witness_price",
                "Value": "${witnessCremation}"
              },
              {
                "Id": "private_viewing_price", 
                "Value": "$${formData.private_family_viewing_total}"
              },
              {
                "Id": "transfer_price",
                "Value": "$${formData.transfer_fee_price}"
              },
              {
                "Id": "death_certificate_qty", 
                "Value": "${formData.death_certificates_quantity}"
              },
              {
                "Id": "death_certificate_price",
                "Value": "$${formData.death_certificates_total}"
              },
              {
                "Id": "shipping",
                "Value": "$${formData.shipping}"
              },
              {
                "Id": "total_before_tax",
                "Value": "$${formData.total_before_tax}"
              },
              {
                "Id": "sale_tax",
                "Value": "$${formData.sales_tax}"
              },
              {
                "Id": "total",
                "Value": "$${formData.total_order}"
              },
              {
                "Id": "purchaser_first_name",
                "Value": "${formData.contact_first_name}"
              },
              {
                "Id": "purchaser_middle_name",
                "Value": "${formData.contact_middle_name}"
              },
              {
                "Id": "purchaser_last_name",
                "Value": "${formData.contact_last_name}"
              },
              {
                "Id": "purchaser_suffix",
                "Value": "${formData.contact_suffix}"
              },
              {
                "Id": "purchaser_relationship",
                "Value": "${formData.contact_relationship}"
              },
              {
                "Id": "purchaser_phone",
                "Value": "${formData.contact_phone}"
              },
              {
                "Id": "purchaser_address",
                "Value": "${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
              },
              {
                "Id": "purchaser_email",
                "Value": "${formData.contact_email}"
              },
              {
                "Id": "deceased_first_name",
                "Value": "${formData.deceased_first_name}"
              },
              {
                "Id": "deceased_middle_name",
                "Value": "${formData.deceased_middle_name}"
              },
              {
                "Id": "deceased_last_name",
                "Value": "${formData.deceased_last_name}"
              },
              {
                "Id": "deceased_suffix",
                "Value": "${formData.deceased_suffix}"
              },
              {
                "Id": "deceased_gender",
                "Value": "${formData.deceased_gender}"
              },
              {
                "Id": "deceased_age",
                "Value": "${formData.deceased_age}"
              },
              {
                "Id": "deceased_ssn",
                "Value": "${formData.deceased_social_security_number}"
              },
              {
                "Id": "deceased_birth",
                "Value": "${formData.deceased_date_birth}"
              },
              {
                "Id": "deceased_address",
                "Value": "${formData.deceased_street_address}, ${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
              },
              {
                "Id": "deceased_phone",
                "Value": "${formData.deceased_phone}"
              },
              {
                "Id": "deceased_email",
                "Value": "${formData.deceased_email}"
              },
              {
                "Id": "license",
                "Value": "${formData.license}"
              },
              {
                "Id": "deceased_full_name",
                "Value": "${formData.deceased_first_name}${formData.deceased_middle_name != '' ? ` ${formData.deceased_middle_name}` : ''} ${formData.deceased_last_name}${formData.deceased_suffix != '' ? ` ${formData.deceased_suffix}` : ''}"
              },
              {
                "Id": "deceased_gender_1",
                "Value": "${formData.deceased_gender}"
              },
              {
                "Id": "deceased_street_address",
                "Value": "${formData.deceased_street_address}"
              },
              {
                "Id": "deceased_city_state_zip",
                "Value": "${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
              },${formData.plan_ahead_person === "Loved One" ? `
                {
                  "Id": "self_or_loved_one",
                  "Value": "Loved One"
                },
                {
                  "Id": "contact_full_name",
                  "Value": "${formData.contact_first_name}${formData.contact_middle_name != '' ? ` ${formData.contact_middle_name}` : ''} ${formData.contact_last_name}${formData.contact_suffix != '' ? ` ${formData.contact_suffix}` : ''}"
                },
                {
                  "Id": "contact_age",
                  "Value": "${formData.contact_age}"
                },
                {
                  "Id": "contact_street_address",
                  "Value": "${formData.contact_street_address}"
                },
                {
                  "Id": "contact_city_state_zip",
                  "Value": "${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
                }` : ''}
            ]
          }
        ]
      }`;

      try {
        const response = await fetch("https://api.boldsign.com/v1/template/send?templateId=775c8725-e1f9-47b2-874c-be69e7f51de1", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "X-API-KEY": boldSignApiKey,
            "Content-Type": "application/json"
          },
          body: body
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json({message: 'There was an issue sending forms', data: data, body: body});
        }

        res.json({message: 'Forms sent successfully'});
      } catch (error) {
        return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error, body: body});
      }
    } else if (formData.deceased_state === "Kentucky") {
      if (formData.plan_ahead_person === "Loved One") {
        const body = `{
          "Roles": [
            {
              "RoleIndex": 1,
              "SignerName": "${formData.contact_first_name}",
              "SignerOrder": 1,
              "SignerEmail": "${formData.contact_email}",
              "SignerType": "Signer",
              "ExistingFormFields": [
                {
                  "Id": "service_type",
                  "Value": "${formData.service_package_type}"
                },
                {
                  "Id": "service_package",
                  "Value": "${formData.service_package_package_name}"
                },
                {
                  "Id": "service_package_price",
                  "Value": "$${formData.service_package_price}"
                },
                {
                  "Id": "urn_title",
                  "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
                },
                {
                  "Id": "urn_details",
                  "Value": "${urnDetails ? `${urnDetails.length > 0 ? urnDetails[0] : ''}
          ${urnDetails.length > 1 ? urnDetails[1] : ''}   ${urnDetails.length > 2 ? urnDetails[2] : ''}
          ${urnDetails.length > 3 ? urnDetails[3] : ''}   ${urnDetails.length > 4 ? urnDetails[4] : ''}` : ''}"
                },
                {
                  "Id": "urn_price",
                  "Value": "${formData.urn_price ? `$${formData.urn_price}` : ''}"
                },
                {
                  "Id": "merchandise_title_0",
                  "Value": "${formData.merchandise_0_title ? `${formData.merchandise_0_title} x ${formData.merchandise_0_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_0",
                  "Value": "${merchandiseDetails0 ? `${merchandiseDetails0.length > 0 ? merchandiseDetails0[0] : ''}
          ${merchandiseDetails0.length > 1 ? merchandiseDetails0[1] : ''}   ${merchandiseDetails0.length > 2 ? merchandiseDetails0[2] : ''}
          ${merchandiseDetails0.length > 3 ? merchandiseDetails0[3] : ''}   ${merchandiseDetails0.length > 4 ? merchandiseDetails0[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_0",
                  "Value": "${formData.merchandise_0_total ? `$${formData.merchandise_0_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_1",
                  "Value": "${formData.merchandise_1_title ? `${formData.merchandise_1_title} x ${formData.merchandise_1_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_1",
                  "Value": "${merchandiseDetails1 ? `${merchandiseDetails1.length > 0 ? merchandiseDetails1[0] : ''}
          ${merchandiseDetails1.length > 1 ? merchandiseDetails1[1] : ''}   ${merchandiseDetails1.length > 2 ? merchandiseDetails1[2] : ''}
          ${merchandiseDetails1.length > 3 ? merchandiseDetails1[3] : ''}   ${merchandiseDetails1.length > 4 ? merchandiseDetails1[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_1",
                  "Value": "${formData.merchandise_1_total ? `$${formData.merchandise_1_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_2",
                  "Value": "${formData.merchandise_2_title ? `${formData.merchandise_2_title} x ${formData.merchandise_2_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_2",
                  "Value": "${merchandiseDetails2 ? `${merchandiseDetails2.length > 0 ? merchandiseDetails2[0] : ''}
          ${merchandiseDetails2.length > 1 ? merchandiseDetails2[1] : ''}   ${merchandiseDetails2.length > 2 ? merchandiseDetails2[2] : ''}
          ${merchandiseDetails2.length > 3 ? merchandiseDetails2[3] : ''}   ${merchandiseDetails2.length > 4 ? merchandiseDetails2[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_2",
                  "Value": "${formData.merchandise_2_total ? `$${formData.merchandise_2_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_3",
                  "Value": "${formData.merchandise_3_title ? `${formData.merchandise_3_title} x ${formData.merchandise_3_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_3",
                  "Value": "${merchandiseDetails3 ? `${merchandiseDetails3.length > 0 ? merchandiseDetails3[0] : ''}
          ${merchandiseDetails3.length > 1 ? merchandiseDetails3[1] : ''}   ${merchandiseDetails3.length > 2 ? merchandiseDetails3[2] : ''}
          ${merchandiseDetails3.length > 3 ? merchandiseDetails3[3] : ''}   ${merchandiseDetails3.length > 4 ? merchandiseDetails3[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_3",
                  "Value": "${formData.merchandise_3_total ? `$${formData.merchandise_3_total}` : ''}"
                },
                {
                  "Id": "witness_price",
                  "Value": "${witnessCremation}"
                },
                {
                  "Id": "private_viewing_price", 
                  "Value": "$${formData.private_family_viewing_total}"
                },
                {
                  "Id": "transfer_price",
                  "Value": "$${formData.transfer_fee_price}"
                },
                {
                  "Id": "death_certificate_qty", 
                  "Value": "${formData.death_certificates_quantity}"
                },
                {
                  "Id": "death_certificate_price",
                  "Value": "$${formData.death_certificates_total}"
                },
                {
                  "Id": "shipping",
                  "Value": "$${formData.shipping}"
                },
                {
                  "Id": "total_before_tax",
                  "Value": "$${formData.total_before_tax}"
                },
                {
                  "Id": "sale_tax",
                  "Value": "$${formData.sales_tax}"
                },
                {
                  "Id": "total",
                  "Value": "$${formData.total_order}"
                },
                {
                  "Id": "purchaser_first_name",
                  "Value": "${formData.contact_first_name}"
                },
                {
                  "Id": "purchaser_middle_name",
                  "Value": "${formData.contact_middle_name}"
                },
                {
                  "Id": "purchaser_last_name",
                  "Value": "${formData.contact_last_name}"
                },
                {
                  "Id": "purchaser_suffix",
                  "Value": "${formData.contact_suffix}"
                },
                {
                  "Id": "purchaser_relationship",
                  "Value": "${formData.contact_relationship}"
                },
                {
                  "Id": "purchaser_phone",
                  "Value": "${formData.contact_phone}"
                },
                {
                  "Id": "purchaser_address",
                  "Value": "${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
                },
                {
                  "Id": "purchaser_email",
                  "Value": "${formData.contact_email}"
                },
                {
                  "Id": "deceased_first_name",
                  "Value": "${formData.deceased_first_name}"
                },
                {
                  "Id": "deceased_middle_name",
                  "Value": "${formData.deceased_middle_name}"
                },
                {
                  "Id": "deceased_last_name",
                  "Value": "${formData.deceased_last_name}"
                },
                {
                  "Id": "deceased_suffix",
                  "Value": "${formData.deceased_suffix}"
                },
                {
                  "Id": "deceased_gender",
                  "Value": "${formData.deceased_gender}"
                },
                {
                  "Id": "deceased_age",
                  "Value": "${formData.deceased_age}"
                },
                {
                  "Id": "deceased_ssn",
                  "Value": "${formData.deceased_social_security_number}"
                },
                {
                  "Id": "deceased_birth",
                  "Value": "${formData.deceased_date_birth}"
                },
                {
                  "Id": "deceased_address",
                  "Value": "${formData.deceased_street_address}, ${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
                },
                {
                  "Id": "deceased_phone",
                  "Value": "${formData.deceased_phone}"
                },
                {
                  "Id": "deceased_email",
                  "Value": "${formData.deceased_email}"
                },
                {
                  "Id": "license",
                  "Value": "${formData.license}"
                },
                {
                  "Id": "deceased_gender_1",
                  "Value": "${formData.deceased_gender}"
                },
                {
                  "Id": "self_or_loved_one",
                  "Value": "Loved One"
                },
                {
                  "Id": "contact_first_name",
                  "Value": "${formData.contact_first_name}"
                },
                {
                  "Id": "contact_middle_name",
                  "Value": "${formData.contact_middle_name}"
                },
                {
                  "Id": "contact_last_name",
                  "Value": "${formData.contact_last_name}"
                },
                {
                  "Id": "contact_relationship",
                  "Value": "${formData.contact_relationship}"
                },
                {
                  "Id": "deceased_street_address",
                  "Value": "${formData.deceased_street_address}"
                },
                {
                  "Id": "deceased_city",
                  "Value": "${formData.deceased_city}"
                },
                {
                  "Id": "deceased_state",
                  "Value": "${formData.deceased_state}"
                },
                {
                  "Id": "deceased_zip",
                  "Value": "${formData.deceased_zip_code}"
                },
              ]
            }
          ]
        }`;
        
        try {
          const response = await fetch("https://api.boldsign.com/v1/template/send?templateId=a01c1cff-d4d0-4c6f-81a3-933c5f67a39f", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "X-API-KEY": boldSignApiKey,
              "Content-Type": "application/json"
            },
            body: body
          });

          const data = await response.json();

          if (!response.ok) {
            return res.status(response.status).json({message: 'There was an issue sending forms', data: data, body: body});
          }

          res.json({message: 'Forms sent successfully'});
        } catch (error) {
          return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error, body: body});
        }
      } else {
        const body = `{
          "Roles": [
            {
              "RoleIndex": 1,
              "SignerName": "${formData.contact_first_name}",
              "SignerOrder": 1,
              "SignerEmail": "${formData.contact_email}",
              "SignerType": "Signer",
              "ExistingFormFields": [
                {
                  "Id": "service_type",
                  "Value": "${formData.service_package_type}"
                },
                {
                  "Id": "service_package",
                  "Value": "${formData.service_package_package_name}"
                },
                {
                  "Id": "service_package_price",
                  "Value": "$${formData.service_package_price}"
                },
                {
                  "Id": "urn_title",
                  "Value": "${formData.urn_quantity > 0 ? `${formData.urn_title} x ${formData.urn_quantity}` : ''}"
                },
                {
                  "Id": "urn_details",
                  "Value": "${urnDetails ? `${urnDetails.length > 0 ? urnDetails[0] : ''}
          ${urnDetails.length > 1 ? urnDetails[1] : ''}   ${urnDetails.length > 2 ? urnDetails[2] : ''}
          ${urnDetails.length > 3 ? urnDetails[3] : ''}   ${urnDetails.length > 4 ? urnDetails[4] : ''}` : ''}"
                },
                {
                  "Id": "urn_price",
                  "Value": "${formData.urn_price ? `$${formData.urn_price}` : ''}"
                },
                {
                  "Id": "merchandise_title_0",
                  "Value": "${formData.merchandise_0_title ? `${formData.merchandise_0_title} x ${formData.merchandise_0_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_0",
                  "Value": "${merchandiseDetails0 ? `${merchandiseDetails0.length > 0 ? merchandiseDetails0[0] : ''}
          ${merchandiseDetails0.length > 1 ? merchandiseDetails0[1] : ''}   ${merchandiseDetails0.length > 2 ? merchandiseDetails0[2] : ''}
          ${merchandiseDetails0.length > 3 ? merchandiseDetails0[3] : ''}   ${merchandiseDetails0.length > 4 ? merchandiseDetails0[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_0",
                  "Value": "${formData.merchandise_0_total ? `$${formData.merchandise_0_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_1",
                  "Value": "${formData.merchandise_1_title ? `${formData.merchandise_1_title} x ${formData.merchandise_1_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_1",
                  "Value": "${merchandiseDetails1 ? `${merchandiseDetails1.length > 0 ? merchandiseDetails1[0] : ''}
          ${merchandiseDetails1.length > 1 ? merchandiseDetails1[1] : ''}   ${merchandiseDetails1.length > 2 ? merchandiseDetails1[2] : ''}
          ${merchandiseDetails1.length > 3 ? merchandiseDetails1[3] : ''}   ${merchandiseDetails1.length > 4 ? merchandiseDetails1[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_1",
                  "Value": "${formData.merchandise_1_total ? `$${formData.merchandise_1_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_2",
                  "Value": "${formData.merchandise_2_title ? `${formData.merchandise_2_title} x ${formData.merchandise_2_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_2",
                  "Value": "${merchandiseDetails2 ? `${merchandiseDetails2.length > 0 ? merchandiseDetails2[0] : ''}
          ${merchandiseDetails2.length > 1 ? merchandiseDetails2[1] : ''}   ${merchandiseDetails2.length > 2 ? merchandiseDetails2[2] : ''}
          ${merchandiseDetails2.length > 3 ? merchandiseDetails2[3] : ''}   ${merchandiseDetails2.length > 4 ? merchandiseDetails2[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_2",
                  "Value": "${formData.merchandise_2_total ? `$${formData.merchandise_2_total}` : ''}"
                },
                {
                  "Id": "merchandise_title_3",
                  "Value": "${formData.merchandise_3_title ? `${formData.merchandise_3_title} x ${formData.merchandise_3_quantity}` : ''}"
                },
                {
                  "Id": "merchandise_details_3",
                  "Value": "${merchandiseDetails3 ? `${merchandiseDetails3.length > 0 ? merchandiseDetails3[0] : ''}
          ${merchandiseDetails3.length > 1 ? merchandiseDetails3[1] : ''}   ${merchandiseDetails3.length > 2 ? merchandiseDetails3[2] : ''}
          ${merchandiseDetails3.length > 3 ? merchandiseDetails3[3] : ''}   ${merchandiseDetails3.length > 4 ? merchandiseDetails3[4] : ''}` : ''}"
                },
                {
                  "Id": "merchandise_price_3",
                  "Value": "${formData.merchandise_3_total ? `$${formData.merchandise_3_total}` : ''}"
                },
                {
                  "Id": "witness_price",
                  "Value": "${witnessCremation}"
                },
                {
                  "Id": "private_viewing_price", 
                  "Value": "$${formData.private_family_viewing_total}"
                },
                {
                  "Id": "transfer_price",
                  "Value": "$${formData.transfer_fee_price}"
                },
                {
                  "Id": "death_certificate_qty", 
                  "Value": "${formData.death_certificates_quantity}"
                },
                {
                  "Id": "death_certificate_price",
                  "Value": "$${formData.death_certificates_total}"
                },
                {
                  "Id": "shipping",
                  "Value": "$${formData.shipping}"
                },
                {
                  "Id": "total_before_tax",
                  "Value": "$${formData.total_before_tax}"
                },
                {
                  "Id": "sale_tax",
                  "Value": "$${formData.sales_tax}"
                },
                {
                  "Id": "total",
                  "Value": "$${formData.total_order}"
                },
                {
                  "Id": "purchaser_first_name",
                  "Value": "${formData.contact_first_name}"
                },
                {
                  "Id": "purchaser_middle_name",
                  "Value": "${formData.contact_middle_name}"
                },
                {
                  "Id": "purchaser_last_name",
                  "Value": "${formData.contact_last_name}"
                },
                {
                  "Id": "purchaser_suffix",
                  "Value": "${formData.contact_suffix}"
                },
                {
                  "Id": "purchaser_relationship",
                  "Value": "${formData.contact_relationship}"
                },
                {
                  "Id": "purchaser_phone",
                  "Value": "${formData.contact_phone}"
                },
                {
                  "Id": "purchaser_address",
                  "Value": "${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}"
                },
                {
                  "Id": "purchaser_email",
                  "Value": "${formData.contact_email}"
                },
                {
                  "Id": "deceased_first_name",
                  "Value": "${formData.deceased_first_name}"
                },
                {
                  "Id": "deceased_middle_name",
                  "Value": "${formData.deceased_middle_name}"
                },
                {
                  "Id": "deceased_last_name",
                  "Value": "${formData.deceased_last_name}"
                },
                {
                  "Id": "deceased_suffix",
                  "Value": "${formData.deceased_suffix}"
                },
                {
                  "Id": "deceased_gender",
                  "Value": "${formData.deceased_gender}"
                },
                {
                  "Id": "deceased_age",
                  "Value": "${formData.deceased_age}"
                },
                {
                  "Id": "deceased_ssn",
                  "Value": "${formData.deceased_social_security_number}"
                },
                {
                  "Id": "deceased_birth",
                  "Value": "${formData.deceased_date_birth}"
                },
                {
                  "Id": "deceased_address",
                  "Value": "${formData.deceased_street_address}, ${formData.deceased_city}, ${formData.deceased_state} ${formData.deceased_zip_code}"
                },
                {
                  "Id": "deceased_phone",
                  "Value": "${formData.deceased_phone}"
                },
                {
                  "Id": "deceased_email",
                  "Value": "${formData.deceased_email}"
                },
                {
                  "Id": "license",
                  "Value": "${formData.license}"
                },
                {
                  "Id": "deceased_gender_1",
                  "Value": "${formData.deceased_gender}"
                },
                {
                  "Id": "deceased_street_address",
                  "Value": "${formData.deceased_street_address}"
                },
                {
                  "Id": "deceased_city",
                  "Value": "${formData.deceased_city}"
                },
                {
                  "Id": "deceased_state",
                  "Value": "${formData.deceased_state}"
                },
                {
                  "Id": "deceased_zip",
                  "Value": "${formData.deceased_zip_code}"
                },
              ]
            }
          ]
        }`;
        try {
          const response = await fetch("https://api.boldsign.com/v1/template/send?templateId=9f2aa91e-4269-42b8-ac1b-d42ca03da911", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "X-API-KEY": boldSignApiKey,
              "Content-Type": "application/json"
            },
            body: body
          });

          const data = await response.json();

          if (!response.ok) {
            return res.status(response.status).json({message: 'There was an issue sending forms', data: data, body: body});
          }

          res.json({message: 'Forms sent successfully'});
        } catch (error) {
          return res.status(500).json({message: 'There was an issue sending forms', data: error.message || error, body: body});
        }
      }
    }
  }
});
app.listen(port, () => console.log(`Listening on port ${port}`));