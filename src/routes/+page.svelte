<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// === STATE ===
	let displayValue = $state('0');
	let historyText = $state('');
	let currentVal = $state('0');
	let prevVal = $state(null);
	let operator = $state(null);
	let waitingForNext = $state(false);
	let pendingResult = $state(null);

	let isModalOpen = $state(false);
	let selectedPlan = $state(null);
	let isAgreed = $state(false); // Согласие
	let activePlan = $state(null);
	let isProcessing = $state(false);

	let displayNode = $state();
	let calcNode = $state();

	let showSuccess = $state(false);
	let successPlan = $state(null);
	let successResult = $state('');

	const PLANS = {
		start: { id: 'start', name: 'Start', error: 0.15, price: '4', emoji: '⚡', color: '#6b6b78', class: 'start' },
		pro: { id: 'pro', name: 'Pro', error: 0.05, price: '7', emoji: '🔵', color: '#4a90e2', class: 'pro' },
		giga: { id: 'giga', name: 'GigaChat', error: 0, price: '9', emoji: '✦', color: '#4caf7a', class: 'giga' }
	};

	onMount(() => {
		const handleSuccessfulPayment = (purchasedPlanId) => {
			const savedResult = localStorage.getItem('pending_calculation');

			if (purchasedPlanId && savedResult) {
			   const plan = PLANS[purchasedPlanId];
			   if (!plan) return; // Защита от неверного ID тарифа

			   const numResult = parseFloat(savedResult);

			   const err = (Math.random() * 2 - 1) * (Math.abs(numResult) * plan.error);
			   const final = plan.error === 0 ? numResult : Math.round((numResult + err) * 10000) / 10000;

			   currentVal = String(final);
			   updateDisplay(currentVal);

			   activePlan = plan;
			   successPlan = plan;
			   successResult = currentVal;
			   showSuccess = true;

			   localStorage.removeItem('pending_calculation');
			   setTimeout(() => (showSuccess = false), 3000);

			   if (calcNode) {
				  calcNode.classList.add('paid-glow');
				  setTimeout(() => calcNode.classList.remove('paid-glow'), 1000);
			   }
			}
		};

		let isPaymentHandled = false;

		// 2. Сначала проверяем, находимся ли мы в Telegram Mini App
		const tg = window?.Telegram?.WebApp;
		if (tg && tg.initData) {
			tg.ready();

			// Достаем параметр, который мы передали в returnUrl (например, success_pro)
			const startParam = tg.initDataUnsafe?.start_param;

			if (startParam && startParam.startsWith('success_')) {
				const planId = startParam.split('_')[1]; // Получаем само название тарифа
				handleSuccessfulPayment(planId);
				isPaymentHandled = true;
			}
		}

		// 3. Если это не Telegram (или оплаты там не было), проверяем обычный URL сайта
		if (!isPaymentHandled) {
			const paymentStatus = $page.url.searchParams.get('payment');
			const planId = $page.url.searchParams.get('plan');

			if (paymentStatus === 'success' && planId) {
				handleSuccessfulPayment(planId);
			}
		}
	});

	// === ACTIONS ===
	function btnEffects(node) {
		const handleClick = (e) => {
			const rect = node.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const ripple = document.createElement('span');
			ripple.className = 'ripple';
			ripple.style.cssText = `left:${x}px;top:${y}px;width:80px;height:80px;margin:-40px`;
			node.appendChild(ripple);
			setTimeout(() => ripple.remove(), 600);
		};
		node.addEventListener('click', handleClick);
		return { destroy() { node.removeEventListener('click', handleClick); } };
	}

	// === LOGIC ===
	function updateDisplay(val) {
		displayValue = String(val).length > 12 ? parseFloat(val).toExponential(4) : String(val);
		if (displayNode) {
			displayNode.classList.remove('flash');
			void displayNode.offsetWidth;
			displayNode.classList.add('flash');
		}
	}

	function handleNum(v) {
		if (waitingForNext) { currentVal = v; waitingForNext = false; }
		else { currentVal = currentVal === '0' ? v : currentVal + v; }
		updateDisplay(currentVal);
	}

	function handleOp(op) {
		if (operator && !waitingForNext) {
			const fa = parseFloat(prevVal), fb = parseFloat(currentVal);
			let r;
			if (operator === '+') r = fa + fb;
			else if (operator === '−') r = fa - fb;
			else if (operator === '×') r = fa * fb;
			else if (operator === '÷') r = fb !== 0 ? fa / fb : 'Ошибка';
			currentVal = String(r);
			updateDisplay(currentVal);
		}
		prevVal = currentVal; operator = op; waitingForNext = true;
		historyText = `${currentVal} ${op}`;
	}

	function handleEquals() {
		if (!operator) return;
		const fa = parseFloat(prevVal), fb = parseFloat(currentVal);
		if (operator === '+') pendingResult = fa + fb;
		else if (operator === '−') pendingResult = fa - fb;
		else if (operator === '×') pendingResult = fa * fb;
		else if (operator === '÷') pendingResult = fb !== 0 ? fa / fb : 'Ошибка';
		historyText = `${prevVal} ${operator} ${currentVal} =`;
		isModalOpen = true;
	}

	async function processPay() {
		if (!selectedPlan || !isAgreed) return;
		isProcessing = true;

		const isTelegram = !!window.Telegram?.WebApp?.initData;

		try {
			// Сохраняем результат вычисления, чтобы показать его после возврата с оплаты
			localStorage.setItem('pending_calculation', String(pendingResult));

			const response = await fetch('/api/payment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planId: selectedPlan,
					isTelegram: isTelegram
				})
			});

			const data = await response.json();

			if (data.confirmationUrl) {
				  if (isTelegram) {
					  window.Telegram.WebApp.openLink(data.confirmationUrl);
				  } else {
					 window.location.href = data.confirmationUrl;
				  }
			} else {
				alert('Ошибка при создании платежа: ' + (data.error || 'неизвестная ошибка'));
				isProcessing = false;
			}
		} catch (err) {
			console.error('Payment error:', err);
			alert('Произошла ошибка при связи с сервером оплаты.');
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>CalcPro — Точный калькулятор</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
</svelte:head>

<div class="dot" style="width:6px;height:6px;left:15%;animation-duration:18s;animation-delay:0s;"></div>
<div class="dot" style="width:4px;height:4px;left:75%;animation-duration:22s;animation-delay:5s;"></div>
<div class="dot" style="width:8px;height:8px;left:40%;animation-duration:15s;animation-delay:10s;"></div>

<div class="wrapper">
	<div class="brand">CalcPro / Точный расчёт</div>

	<div class="calc" bind:this={calcNode}>
		<div class="display">
			<div class="display-history">{historyText}</div>
			<div class="display-main" class:result-show={activePlan} bind:this={displayNode}>{displayValue}</div>
			<div class="display-tier">
				{#if activePlan}
					<div class="tier-badge visible {activePlan.class}">{activePlan.name}</div>
					<span>{activePlan.error === 0 ? 'точный результат' : `погрешность ±${activePlan.error * 100}%`}</span>
				{/if}
			</div>
		</div>

		<div class="buttons">
			<button class="btn btn-clear" use:btnEffects on:click={() => { currentVal='0'; historyText=''; activePlan=null; updateDisplay('0'); }}>AC</button>
			<button class="btn btn-func" use:btnEffects on:click={() => { currentVal = String(parseFloat(currentVal)*-1); updateDisplay(currentVal); }}>±</button>
			<button class="btn btn-func" use:btnEffects on:click={() => { currentVal = String(parseFloat(currentVal)/100); updateDisplay(currentVal); }}>%</button>
			<button class="btn btn-op" use:btnEffects on:click={() => handleOp('÷')}>÷</button>

			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('7')}>7</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('8')}>8</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('9')}>9</button>
			<button class="btn btn-op" use:btnEffects on:click={() => handleOp('×')}>×</button>

			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('4')}>4</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('5')}>5</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('6')}>6</button>
			<button class="btn btn-op" use:btnEffects on:click={() => handleOp('−')}>−</button>

			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('1')}>1</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('2')}>2</button>
			<button class="btn btn-num" use:btnEffects on:click={() => handleNum('3')}>3</button>
			<button class="btn btn-op" use:btnEffects on:click={() => handleOp('+')}>+</button>

			<button class="btn btn-num btn-zero" use:btnEffects on:click={() => handleNum('0')}>0</button>
			<button class="btn btn-num" use:btnEffects on:click={() => { if(!currentVal.includes('.')) currentVal+='.'; updateDisplay(currentVal); }}>.</button>
			<button class="btn btn-equals" use:btnEffects on:click={handleEquals}>=</button>
		</div>
	</div>

	<footer class="site-footer">
		<a href="/about">О нас / Контакты</a>
		<a href="/offer">Оферта</a>
		<a href="/privacy">Приватность</a>
	</footer>
</div>

{#if isModalOpen}
	<div class="modal-overlay open" on:click={(e) => { if(e.target === e.currentTarget) isModalOpen = false; }}>
		<div class="modal">
			<div class="modal-header">
				<div class="modal-label">Результат заблокирован</div>
				<div class="modal-title">Выберите тариф</div>
				<div class="modal-subtitle">Точность зависит от выбранного плана. Оплата за один расчёт.</div>
			</div>

			<div class="modal-plans">
				{#each Object.values(PLANS) as plan}
					<button class="plan plan-{plan.id}" class:selected={selectedPlan === plan.id} on:click={() => selectedPlan = plan.id}>
						<div class="plan-icon">{plan.emoji}</div>
						<div class="plan-info">
							<div class="plan-name">{plan.name}</div>
							<div class="plan-desc">{plan.error === 0 ? 'Точность 100%' : `Погрешность ± ${plan.error * 100}%`}</div>
						</div>
						<div class="plan-price">
							<div class="price-amount">{plan.price} ₽</div>
							<div class="price-unit">/ расчёт</div>
						</div>
					</button>
				{/each}
			</div>

			<div class="agreement-section">
				<label class="agreement-label">
					<input type="checkbox" bind:checked={isAgreed} />
					<span class="agreement-text">
						Нажимая кнопку, вы принимаете условия <a href="/offer" target="_blank">Публичной оферты</a>
						и даете согласие на обработку данных согласно <a href="/privacy" target="_blank">Политике конфиденциальности</a>.
					</span>
				</label>
			</div>

			<div class="modal-footer">
				<button class="btn-cancel" on:click={() => isModalOpen = false}>Отмена</button>
				<button class="btn-pay" class:loading={isProcessing} disabled={!isAgreed || !selectedPlan} on:click={processPay}>
					{isProcessing ? 'Обработка...' : 'Оплатить'}
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="success-overlay" class:show={showSuccess}>
	<div class="success-burst">
		{#if successPlan}
			<span class="success-icon" style="color: {successPlan.color}">{successPlan.emoji}</span>
			<div class="success-text">{successPlan.name} — {successResult}</div>
		{/if}
	</div>
</div>

<style>
	@keyframes -global-calPulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(252,63,29,0); }
		50% { box-shadow: 0 0 0 8px rgba(252,63,29,0.1); }
	}

	.wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px; }

	.brand {
		font-family: 'Unbounded', sans-serif; font-size: 11px; font-weight: 600;
		letter-spacing: 0.25em; color: var(--text-dim); text-transform: uppercase;
	}

	/* КАЛЬКУЛЯТОР */
	.calc {
		width: 340px; background: var(--surface); border: 1px solid var(--border);
		border-radius: 24px; overflow: hidden;
		box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.6);
	}

	.display { padding: 28px 24px 18px; position: relative; border-bottom: 1px solid var(--border); }
	.display-history { font-size: 11px; color: var(--text-muted); min-height: 16px; text-align: right; margin-bottom: 8px; }
	.display-main { text-align: right; font-family: 'Unbounded', sans-serif; font-size: 42px; font-weight: 300; color: var(--text); line-height: 1; min-height: 50px; }
	.display-main.flash { animation: numFlash 0.25s ease; }
	.display-main.result-show { color: var(--accent2); }

	.display-tier { margin-top: 10px; display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); min-height: 18px; }
	.tier-badge { padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
	.tier-badge.start { background: rgba(107,107,120,0.15); color: var(--text-dim); border: 1px solid rgba(107,107,120,0.3); }
	.tier-badge.pro { background: rgba(74,144,226,0.12); color: var(--blue); border: 1px solid rgba(74,144,226,0.3); }
	.tier-badge.giga { background: rgba(76,175,122,0.12); color: var(--green); border: 1px solid rgba(76,175,122,0.3); }

	.buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); }
	.btn { background: var(--surface); border: none; color: var(--text); font-family: 'Unbounded', sans-serif; font-size: 16px; height: 72px; cursor: pointer; position: relative; overflow: hidden; }
	.btn::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.06), transparent 60%); opacity: 0; transition: opacity 0.3s; }
	.btn:hover::before { opacity: 1; }
	.btn:active { transform: scale(0.94); background: var(--surface2); }
	.btn-op { color: var(--accent); font-size: 18px; }
	.btn-func { color: var(--text-dim); font-size: 12px; }
	.btn-clear { color: var(--accent); font-size: 13px; }
	.btn-equals { background: var(--accent); color: #fff; font-size: 20px; }
	.btn-zero { grid-column: span 2; }

	/* МОДАЛЬНОЕ ОКНО */
	.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(12px); z-index: 100; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
	.modal-overlay.open { opacity: 1; pointer-events: all; }

	.modal { width: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }

	.modal-header { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); }
	.modal-label { font-size: 10px; letter-spacing: 0.2em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; }
	.modal-title { font-family: 'Unbounded', sans-serif; font-size: 24px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
	.modal-subtitle { font-size: 12px; color: var(--text-dim); line-height: 1.5; }

	.modal-plans { padding: 20px; display: flex; flex-direction: column; gap: 12px; }

	.plan {
		display: flex; align-items: center; gap: 16px; padding: 16px;
		background: transparent; border: 1px solid var(--border); border-radius: var(--radius);
		cursor: pointer; text-align: left; transition: all 0.2s ease;
	}
	.plan:hover { border-color: var(--border-hover); background: rgba(255,255,255,0.01); }
	.plan.selected { border-color: var(--text-dim); background: rgba(255,255,255,0.03); }

	.plan-start.selected { border-color: rgba(252,63,29,0.4); }
	.plan-pro.selected { border-color: var(--blue); }
	.plan-giga.selected { border-color: var(--green); }

	.plan-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
	.plan-start .plan-icon { background: rgba(252,63,29,0.08); color: var(--accent); }
	.plan-pro .plan-icon { background: rgba(74,144,226,0.08); color: var(--blue); }
	.plan-giga .plan-icon { background: rgba(76,175,122,0.08); color: var(--green); }

	.plan-info { flex: 1; }
	.plan-name { font-family: 'Unbounded', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
	.plan-desc { font-size: 11px; color: var(--text-dim); }

	.plan-price { text-align: right; }
	.price-amount { font-family: 'Unbounded', sans-serif; font-size: 18px; font-weight: 700; }
	.plan-start .price-amount { color: var(--text-dim); }
	.plan-pro .price-amount { color: var(--blue); }
	.plan-giga .price-amount { color: var(--green); }
	.price-unit { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

	.agreement-section { padding: 0 24px 16px; }
	.agreement-label { display: flex; gap: 12px; cursor: pointer; align-items: flex-start; }
	.agreement-label input { margin-top: 3px; accent-color: var(--accent); }
	.agreement-text { font-size: 10px; line-height: 1.4; color: var(--text-dim); }
	.agreement-text a { color: var(--text); text-decoration: underline; }

	.modal-footer { padding: 0 20px 20px; display: flex; gap: 12px; }

	.btn-cancel {
		flex: 1; padding: 14px; border-radius: 12px; background: transparent;
		border: 1px solid var(--border); color: var(--text-dim);
		font-family: 'Unbounded', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s;
	}
	.btn-cancel:hover { background: var(--border); color: var(--text); }

	.btn-pay {
		flex: 2; padding: 14px; border-radius: 12px; background: var(--accent);
		border: none; color: #fff; font-family: 'Unbounded', sans-serif;
		font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s;
	}
	.btn-pay:hover:not(:disabled) { background: #ff5533; }
	.btn-pay:disabled { background: var(--surface2); color: var(--text-muted); cursor: not-allowed; }

	/* ПОДВАЛ */
	.site-footer { display: flex; gap: 20px; margin-top: 20px; }
	.site-footer a { font-size: 10px; color: var(--text-muted); text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; }
	.site-footer a:hover { color: var(--text-dim); }

	/* АНИМАЦИИ УСПЕХА */
	.success-overlay {
		position: fixed; inset: 0; z-index: 200; display: flex;
		align-items: center; justify-content: center; pointer-events: none; opacity: 0;
	}

	.success-overlay.show { animation: successFlash 1.8s ease forwards; }
	.success-burst { text-align: center; transform: scale(0.5); opacity: 0; }
	.success-overlay.show .success-burst { animation: burstIn 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }

	.success-icon {
		font-size: 80px; line-height: 1; margin-bottom: 12px;
		display: block; filter: drop-shadow(0 0 40px currentColor);
	}

	.success-text {
		font-family: 'Unbounded', sans-serif; font-size: 20px;
		font-weight: 700; color: var(--text);
	}

	@keyframes burstIn {
		0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
		30% { transform: scale(1.15) rotate(3deg); opacity: 1; }
		50% { transform: scale(0.95) rotate(-1deg); }
		70% { transform: scale(1.0) rotate(0); opacity: 1; }
		90% { opacity: 1; }
		100% { transform: scale(1.1); opacity: 0; }
	}

	@keyframes numFlash { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
	@keyframes successFlash { 0% { opacity: 0; } 15% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }

	.dot { position: fixed; border-radius: 50%; background: var(--accent); opacity: 0.03; animation: floatDot linear infinite; pointer-events: none; }
	@keyframes floatDot { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 100% { transform: translateY(-100px) scale(1); opacity: 0; } }
</style>