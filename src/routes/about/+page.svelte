<div class="content">
	<section class="hero">
		<h1>О проекте CalcPro</h1>
		<p class="subtitle">Интеллектуальные вычисления нового поколения</p>
	</section>

	<section class="description">
		<p>
			<strong>CalcPro</strong> — это экспериментальный сервис, рожденный на стыке классической математики и современных нейросетевых технологий. Мы решаем проблему «стандартных» вычислений, предлагая пользователям гибкую систему точности, управляемую алгоритмами вероятностного анализа.
		</p>
		<p>
			Наш калькулятор не просто складывает числа — он оценивает вычислительную сложность каждого запроса, предоставляя результат в соответствии с выбранным уровнем нейросетевого приоритета.
		</p>
	</section>

	<section class="features">
		<div class="feature-card">
			<span class="icon">✦</span>
			<h3>Точность</h3>
			<p>От базовых быстрых прикидок до эталонных Giga-вычислений.</p>
		</div>
		<div class="feature-card">
			<span class="icon">⚡</span>
			<h3>Скорость</h3>
			<p>Мгновенная обработка данных на распределенных узлах.</p>
		</div>
	</section>

	<section class="contacts">
		<h2>Реквизиты и контакты</h2>
		<div class="contacts-grid">
			<div class="contact-item">
				<span class="label">Разработчик</span>
				<span class="value">Грунин Алексей Сергеевич</span>
			</div>
			<div class="contact-item">
				<span class="label">ИНН (Самозанятый)</span>
				<span class="value">024806074840</span>
			</div>
			<div class="contact-item">
				<span class="label">Связь</span>
				<span class="value">
					<a href="mailto:xiroke2509@gmail.com">xiroke2509@gmail.com</a>
				</span>
			</div>
		</div>
	</section>

	<div class="footer-nav">
		<a href="/" class="back-link">← Вернуться к вычислениям</a>
	</div>
</div>

<style>
	:global(body) {
		background: #0d0d0f;
		margin: 0;
	}

	.content {
		max-width: 800px;
		margin: 60px auto;
		padding: 40px;
		background: #141416;
		border: 1px solid #2a2a30;
		border-radius: 32px;
		color: #f0f0f4;
		font-family: 'JetBrains Mono', monospace;
		line-height: 1.6;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
	}

	h1, h2, h3 {
		font-family: 'Unbounded', sans-serif;
		text-transform: uppercase;
		margin: 0;
	}

	h1 {
		font-size: 32px;
		color: #fc3f1d;
		margin-bottom: 8px;
	}

	.subtitle {
		font-size: 14px;
		color: #6b6b78;
		letter-spacing: 0.1em;
		margin-bottom: 40px;
	}

	.description p {
		font-size: 15px;
		color: #b0b0ba;
		margin-bottom: 20px;
	}

	.description strong {
		color: #fff;
	}

	/* Карточки преимуществ */
	.features {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin: 40px 0;
	}

	.feature-card {
		background: #1c1c20;
		padding: 24px;
		border-radius: 20px;
		border: 1px solid #2a2a30;
	}

	.feature-card .icon {
		font-size: 24px;
		color: #fc3f1d;
		display: block;
		margin-bottom: 12px;
	}

	.feature-card h3 {
		font-size: 14px;
		margin-bottom: 8px;
	}

	.feature-card p {
		font-size: 12px;
		color: #6b6b78;
		margin: 0;
	}

	/* Сетка контактов */
	.contacts {
		margin-top: 50px;
		padding-top: 30px;
		border-top: 1px solid #2a2a30;
	}

	.contacts h2 {
		font-size: 18px;
		margin-bottom: 24px;
	}

	.contacts-grid {
		display: grid;
		gap: 16px;
	}

	.contact-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 10px;
		text-transform: uppercase;
		color: #585865;
		letter-spacing: 0.1em;
	}

	.value {
		font-size: 14px;
		color: #f0f0f4;
	}

	.value a {
		color: #fc3f1d;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: 0.2s;
	}

	.value a:hover {
		border-bottom-color: #fc3f1d;
	}

	/* Навигация */
	.footer-nav {
		margin-top: 50px;
		text-align: center;
	}

	.back-link {
		display: inline-block;
		font-family: 'Unbounded', sans-serif;
		font-size: 12px;
		color: #6b6b78;
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #fc3f1d;
	}

	@media (max-width: 600px) {
		.features { grid-template-columns: 1fr; }
		.content { margin: 20px; padding: 24px; }
	}
</style>