import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY } from '$env/static/private';

const PLANS = {
	start: { name: 'Start', price: '4.00' },
	pro: { name: 'Pro', price: '7.00' },
	giga: { name: 'GigaChat', price: '9.00' }
};

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { planId } = await request.json();
		const plan = PLANS[planId as keyof typeof PLANS];

		if (!plan) {
			return json({ error: 'Invalid plan' }, { status: 400 });
		}

		// Формируем return_url (на ту же страницу, где был пользователь)
		const returnUrl = `${url.origin}/?payment=success&plan=${planId}`;

		const response = await fetch('https://api.yookassa.ru/v3/payments', {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`,
				'Idempotence-Key': crypto.randomUUID(),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				amount: {
					value: plan.price,
					currency: 'RUB'
				},
				capture: true,
				confirmation: {
					type: 'redirect',
					return_url: returnUrl
				},
				description: `Оплата тарифа ${plan.name} в CalcPro`
			})
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Yookassa error:', data);
			return json({ error: data.description || 'Payment creation failed' }, { status: response.status });
		}

		return json({ confirmationUrl: data.confirmation.confirmation_url });
	} catch (err) {
		console.error('Server error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
