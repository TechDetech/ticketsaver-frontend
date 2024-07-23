<<<<<<< HEAD
//import {supabase} from '../utils/supabaseClient'
import { createClient } from '@supabase/supabase-js'
=======
import { supabase } from '../utils/supabaseClient'
>>>>>>> c358698b2e476069c178881960cee721fea82d20

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('Supabase client created:', supabase)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables')
}
export const handler = async (event, _context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const { seats } = JSON.parse(event.body) // Assuming the body contains an array of seats to check
  console.log(seats)

  if (!Array.isArray(seats) || seats.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request format: Array of seats required.' })
    }
  }

  try {
    const checks = seats.map(
      (seat) =>
        supabase
          .from('YuridiaSeatMap')
          .select('Seat, row, col, LockedStatus, isTaken')
          .eq('Seat', seat.Seat)
          .eq('subZone', seat.subZone)
          .eq('row', seat.row)
          .eq('col', seat.col)
          .single() // Assuming a single row per seat
    )
    const results = await Promise.all(checks)

    // Filter out seats that are taken or locked
    const takenSeats = results
      .filter((result) => {
        const { data, error } = result
        if (error) {
          console.error('Error fetching seat availability:', error)
          return false
        }
        return data.isTaken || data.LockedStatus
      })
      .map(({ data }) => ({
        Seat: data.Seat,
        row: data.row,
        col: data.col,
        subZone: seats.find((seat) => seat.row === data.row && seat.col === data.col).subZone
      }))

    // Return the taken (or unavailable) seats
    return {
      statusCode: 200,
      body: JSON.stringify({ takenSeats })
    }
  } catch (error) {
    console.error('Server error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to check seat availability' })
    }
  }
}
