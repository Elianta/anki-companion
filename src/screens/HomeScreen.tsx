export function HomeScreen() {
  return (
    <section className="screen">
      <h1>Ввод слова или чанка</h1>
      <p className="screen-description">
        TODO: подключить форму запроса к LLM, чтобы получать кандидаты значений.
      </p>
      <button type="button" disabled className="primary-btn" aria-disabled="true">
        Ожидает реализации
      </button>
    </section>
  )
}
