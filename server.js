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
      revision: '2025-04-15',
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
            revision: '2025-04-15',
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
                revision: '2025-04-15',
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
        'id': paymentIntent.metadata.orderId,
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
    .then(response => response.json())
    .then(data => res.json({data: data, paymentIntent: paymentIntent, id: paymentIntent.metadata.orderId}));
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent failed! ID: ${paymentIntent.id}`);
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

app.post('/check-medicaid-verification-password', (req, res) => {
  const { password } = req.body;
  //const correctPassword = process.env.MEDICAID_VERIFICATION_PASSWORD;
  const correctPassword = 'Magnolia1234'; // Temporary for testing

  if (password === correctPassword) {
    res.json({valid: true});
  } else {
    res.json({valid: false});
  }
});

app.post('/medicaid-eligibility-approved', async (req, res) => {
  const { first_name, last_name, phone, email, caseNumber } = req.body;

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
        revision: '2025-04-15',
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
  const { first_name, last_name, phone, email } = req.body;

  try {
    const body = `{
      "data":{
        "type":"event",
        "attributes":{
          "properties":{
            "first_name":"${first_name}",
            "last_name":"${last_name}",
            "phone_number":"${phone}",
            "email":"${email}"
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
        revision: '2025-04-15',
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

const recentMedicaidOrders = new Map(); // Store recent orders to prevent duplicates

// Update the medicaid-checkout endpoint
app.post('/medicaid-checkout', async (req, res) => {
  const { totalAmount, customerAmount, medicaidAmount, customerId, cartLines } = req.body;
  
  // Create a unique key for this request
  const requestKey = `${customerId}-${totalAmount}-${cartLines.length}`;
  
  // Check if we've processed this recently (within 30 seconds)
  if (recentMedicaidOrders.has(requestKey)) {
    const lastProcessed = recentMedicaidOrders.get(requestKey);
    if (Date.now() - lastProcessed < 30000) {
      console.log('Duplicate Medicaid order request blocked');
      return res.json({ 
        success: true,
        message: 'Order already processed recently',
        duplicate: true
      });
    }
  }
  
  // Mark this request as being processed
  recentMedicaidOrders.set(requestKey, Date.now());
  
  // Clean up old entries (older than 1 minute)
  for (const [key, timestamp] of recentMedicaidOrders.entries()) {
    if (Date.now() - timestamp > 60000) {
      recentMedicaidOrders.delete(key);
    }
  }
  
  try {
    const order = await createMedicaidOrder({
      totalAmount,
      customerAmount,
      medicaidAmount,
      customerId,
      cartLines
    });
    
    const orderNumber = order.name;
    
    res.json({ 
      success: true,
      orderId: order.id,
      orderNumber: orderNumber,
      message: 'Medicaid order created successfully'
    });
  } catch (error) {
    // Remove from cache on error so it can be retried
    recentMedicaidOrders.delete(requestKey);
    
    console.error('Medicaid checkout error:', error);
    res.status(500).json({ 
      message: 'Unable to process Medicaid checkout. Please call (502) 653-5834 for assistance.',
      error: error.message,
      details: error.stack
    });
  }
});

// Simplified createMedicaidOrder function
async function createMedicaidOrder(data) {
  const { customerAmount, medicaidAmount, customerId, cartLines } = data;
  
  const lineItems = cartLines.map(line => ({
    variantId: line.merchandise.id,
    quantity: line.quantity
  }));
  
  const orderQueryString = `
    mutation orderCreate($order: OrderCreateOrderInput!) {
      orderCreate(order: $order) {
        order {
          id
          name
          totalPrice
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const orderVariables = {
    order: {
      customerId: customerId,
      lineItems: lineItems,
      financialStatus: "PENDING", // Always PENDING since we're waiting for Medicaid payment
      note: `Medicaid Split Payment - Customer: $${customerAmount.toFixed(2)}, Medicaid: $${medicaidAmount.toFixed(2)}${customerAmount === 0 ? ' (Fully Medicaid Covered)' : ''}`,
      tags: [
        "Medicaid"
      ]
    }
  };

  console.log('Sending GraphQL request with variables:', JSON.stringify(orderVariables, null, 2));

  const response = await fetch('https://magnolia-api.onrender.com/shopify-admin-api-test-store', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queryString: orderQueryString,
      variables: orderVariables
    })
  });

  const result = await response.json();
  console.log('Full API response:', JSON.stringify(result, null, 2));
  
  if (result.data?.data?.orderCreate?.userErrors?.length > 0) {
    throw new Error(`Order creation failed: ${result.data.data.orderCreate.userErrors[0].message}`);
  }

  if (!result.data?.data?.orderCreate?.order) {
    throw new Error('No order returned from Shopify API');
  }

  return result.data.data.orderCreate.order;
}

app.listen(port, () => console.log(`Listening on port ${port}`));