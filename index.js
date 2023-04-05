// package imports
const http = require('http');
const express = require('express');
const app = express();
require('dotenv').config();
// cors
const cors = require('cors');
const stripe = require('stripe')("SECRET_TEST_KEY");

// configure cors
app.use(cors());

app.use(express.static(__dirname.replace(/\\/g, '/') + '/view/dist'));

// configure server
const port = process.env.PORT || 3000;
const server = http.createServer(app);

var CUSTOMER = 'CUSTOMER_ID';

function updateSubscription() {
    stripe.subscriptions.update(
        subscription.id,
        {
            // set cancel at to 12 months from now
            cancel_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 12,
        },
    );
}

// webhook

app.post('/stripe/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];
    const endpointSecret = "WEBHOOK_SECRET";
    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        console.log(err);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'invoice.created':
            var invoice = event.data.object;
            console.log(`Invoice ${invoice.id} was created!`);
            break;
        case 'invoice.paid':
            var invoice = event.data.object;
            console.log(`Invoice ${invoice.id} was paid!`);
            break;
        case 'invoice.payment_failed':
            var invoice = event.data.object;
            console.log(`Invoice ${invoice.id} failed to pay!`);
            break;
        case 'subscription_schedule.created':
            var subscription_schedule = event.data.object;
            console.log(`Subscription schedule ${subscription_schedule.id} was created!`);
        // Subscription created for customer
        case 'customer.subscription.created':
            var subscription = event.data.object;
            console.log(`Subscription ${subscription.id} was created!`);
            // Update the subscription to cancel at the end of the current period
            updateSubscription();
            break;
        // Recurring payment will come through here
        case 'customer.subscription.updated':
            var subscription = event.data.object;
            console.log(subscription);
            console.log(`Subscription ${subscription.id} was updated!`);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
});

// create checkout session for subscription
app.post('/stripe/checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
            {
                price: 'PRICE_ID',
                quantity: 1,
            },
        ],
        customer: CUSTOMER,
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
    });
    
    res.send({
        session_url: session
    })
});






server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});