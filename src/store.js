import { writable } from 'svelte/store'

export const PLANS = {
  start: { name: 'Start',    error: 0.15, price: '4 ₽', emoji: '⚡', color: '#6b6b78', cls: 'start' },
  pro:   { name: 'Pro',      error: 0.05, price: '7 ₽', emoji: '🔵', color: '#4a90e2', cls: 'pro'   },
  giga:  { name: 'GigaChat', error: 0,    price: '9 ₽', emoji: '✦',  color: '#4caf7a', cls: 'giga'  },
}

function createCalcStore() {
  const { subscribe, update, set } = writable({
    currentVal: '0',
    prevVal: null,
    operator: null,
    waitingForNext: false,
    pendingResult: null,
    historyStr: '',
    displayFlash: false,
    resultShow: false,
    activeTier: null,     // tier applied to last result
    activeOp: null,
  })

  return { subscribe, update, set }
}

export const calc = createCalcStore()

export function applyError(result, errorFraction) {
  if (errorFraction === 0 || typeof result !== 'number') return result
  const maxErr = Math.abs(result) * errorFraction
  const err = (Math.random() * 2 - 1) * maxErr
  return result + err
}

export function calculate(a, op, b) {
  const fa = parseFloat(a), fb = parseFloat(b)
  switch (op) {
    case '+': return fa + fb
    case '−': return fa - fb
    case '×': return fa * fb
    case '÷': return fb !== 0 ? fa / fb : 'Ошибка'
  }
}

export function formatResult(val) {
  if (val === 'Ошибка') return val
  const n = parseFloat(val)
  if (isNaN(n)) return '0'
  if (Number.isInteger(n) && Math.abs(n) < 1e10) return String(n)
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(4)
  return parseFloat(n.toFixed(8)).toString()
}

export function formatDisplay(val) {
  const s = String(val)
  if (s.length > 12) return parseFloat(val).toExponential(4)
  return s
}
