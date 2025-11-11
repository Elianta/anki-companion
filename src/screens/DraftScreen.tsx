export function DraftScreen() {
  return (
    <section className="screen">
      <h1>Черновик карточки</h1>
      <p className="screen-description">
        TODO: редактировать поля карточки Word / Definition / Translation / Example.
      </p>
      <button type="button" disabled className="primary-btn" aria-disabled="true">
        Редактор в разработке
      </button>
    </section>
  )
}
