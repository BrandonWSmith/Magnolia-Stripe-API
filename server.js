const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 11000;
require('@shopify/shopify-api/adapters/node');
const { Session, shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/calculator-contact', (req, res) => {
  const { formData } = req.body;
  console.log(formData);
  const emailBody = `
    <p>Magnolia's Essential Cremation Package</p>
    <b>Cremation Service Package - $895</b>
    <br>
    <p>Choose the Perfect Urn for Your Loved One</p>
    <b>${formData.urn_price}</b>
    <br>
    <p>Would you like to personalize the urn with a special engraving?</p>
    <b>${formData.urn_engraving ? "Yes" : "No"}</b>
    <br>
    <p>Would you like to schedule a "Private Family Viewing?</p>
    <b>${formData.private_family_viewing_total > 0 ? "Yes" : "No"}</b>
    <br>
    <p>Please enter the address (or City, State) for the pickup location of your loved one to calculate any additional transporation fees:</p>
    <b>${formData.contact_street_address}, ${formData.contact_city}, ${formData.contact_state} ${formData.contact_zip_code}</b>
    <br>
    <p>Additional transportation fee from pickup location:</p>
    <b>${formData.transfer_fee}</b>
    <br>
    <p>How many death certificates do you need?</p>
    <b>${formData.death_certificates_quantity}</b>
    <br>
    <p>Would you like us to use USPS's cremains service to safely ship your loved one to you?</p>
    <b>${formData.shipping > 0 ? "Yes" : "No, I'll pick up my loved one."}</b>
    <br>
    <p>TOTAL PACKAGE PRICE</p>
    <b>${formData.total_price}</b>
    <br>
    <p>Name:</p>
    <b>${formData.name}</b>
    <br>
    <p>Phone:</p>
    <b>${formData.phone}</b>
    <br>
    <p>How Would You Prefer to Communicate?</p>
    <b>${formData.contact_type}</b>
    <br>
    <p>Preferred Time?</p>
    <b>${formData.contact_time}</b>
  `;
  console.log(process.env.EMAIL_PASSWORD);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'brandon@magnoliacremations.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: 'brandon@magnoliacremations.com',
    to: 'brandon@magnoliacremations.com',
    subject: 'Client Requesting Assistance',
    html: emailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.json({data: error});
    } else {
      console.log('Email sent: ' + info.response);
      res.json({data: info});
    }
  });
});

app.post('/klaviyo-checkout-event', async (req, res) => {
  const { formData } = req.body;
  console.log(formData);
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