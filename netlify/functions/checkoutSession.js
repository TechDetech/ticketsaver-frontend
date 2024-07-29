import Stripe from 'stripe'
import { findCustomer } from '../utils/customer'
import { CustomAuthError } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

exports.handler = async function (event, _context) {
  console.log('Event received:', event)

  if (event.httpMethod == 'POST') {
    try {
      const { cart, eventInfo, customer } = JSON.parse(event.body)

      console.log('Parsed event body:', { cart, eventInfo, customer })

      if (!cart || !eventInfo) {
        throw new Error('Missing cart or event details')
      }

      console.log('Calling findCustomer with:', customer)
      const customerId = await findCustomer(customer)
      console.log('Customer ID:', customerId)

      const lineItems = cart.map((ticket) => ({
        price_data: {
          currency: 'USD',
          unit_amount: ticket.price_final * 100, // Stripe expects the amount in cents
          product_data: {
            name: `Ticket: ${ticket.seatLabel}; ${ticket.priceType}; Zone: ${ticket.subZone}`,
            description: `Event: ${eventInfo.name} at ${eventInfo.venue} on ${eventInfo.date}`
          }
        },
        quantity: 1
      }))
      console.log('Line items for checkout session:', lineItems)

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        return_url: `https://localhost:8888/return?session_id={CHECKOUT_SESSION_ID}`,

        customer: customerId,
        invoice_creation: {
          enabled: true,
          invoice_data: {
            metadata: {
              ticketId: `${cart.ticketId}`,
              eventName: `${eventInfo.id}`,
              venue: `${eventInfo.venue}`,
              venueId: `${eventInfo.venueId}`,
              date: `${eventInfo.date}`,
              location: `${eventInfo.location}`,
              issuedAt: `${cart.issuedAt}`,
              name: customer?.name,
              email: customer?.email
            }
          }
        },
        payment_intent_data: {
          metadata: {
            event_label: `${eventInfo.id}`
          }
        }
      })

      console.log('Checkout session created successfully:', session)
      return {
        statusCode: 200,
        body: JSON.stringify({ clientSecret: session.client_secret })
      }
    } catch (error) {
      console.error('Error creating checkout session:', error.message)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create checkout session' })
      }
    }
  }
}
