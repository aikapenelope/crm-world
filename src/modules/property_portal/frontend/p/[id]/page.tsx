/**
 * Public property page — /p/[id]
 * Accessible without authentication.
 * Shows property details, images, specs, and contact button.
 */
const PropertyPublicPage = async ({ params }: { params: { id: string } }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center text-muted-foreground">
          <p>Cargando propiedad...</p>
        </div>
      </div>
    </div>
  )
}

export default PropertyPublicPage
