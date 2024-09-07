import { Handler, HandlerEvent } from "@netlify/functions";
import bcrypt from 'bcryptjs'
interface DataDict {
    client_info: string
    ticket_tag: string
    charge_id: string
    event_label: string
    ticket_token: string,
    password: string
}

const scanPassword = process.env.SCAN_PASSWORD;

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
    const data: { password: string } = JSON.parse(event.body)
    // hash the password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(data.password, salt);
    return {
        statusCode: 200,
        body: JSON.stringify({ hash })
    };
};