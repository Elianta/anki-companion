export function ExportScreen() {
  return (
    <section className="screen">
      <h1>Экспорт в Anki</h1>
      <p className="screen-description">
        TODO: собрать выбранные карточки, сгенерировать .apkg через anki-apkg-export.
      </p>
      <button type="button" disabled className="primary-btn" aria-disabled="true">
        Экспорт недоступен
      </button>
    </section>
  )
}
