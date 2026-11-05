'use strict';

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

function handleWebhook(req, res) {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (
    !signature ||
    !signature.startsWith('sha256=') ||
    !/^[a-fA-F0-9]{64}$/.test(signature.slice(7)) ||
    !secret
  ) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  const received = Buffer.from(signature.slice(7), 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (!crypto.timingSafeEqual(expectedBuffer, received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString());

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  _processedIds.add(event.id);

  res.status(200).json({ status: 'received' });

  setImmediate(() => {
    handleEvent(event);
  });
}

module.exports = { handleWebhook, _processedIds };
