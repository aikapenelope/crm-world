# Properties Module — Spec

## Summary

Core module for the Real Estate vertical. Manages property listings with types, operations, status lifecycle, pricing, location, images, and external links.

## Entities

### `properties`

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | Yes | gen_random_uuid() | PK |
| tenant_id | uuid | Yes | — | Multi-tenant |
| organization_id | uuid | Yes | — | Multi-tenant |
| title | varchar(255) | Yes | — | Listing title |
| description | text | No | null | Full description |
| property_type | varchar(30) | Yes | — | See enum below |
| operation | varchar(20) | Yes | — | See enum below |
| status | varchar(20) | Yes | 'draft' | See lifecycle below |
| price | decimal(18,2) | Yes | — | Listing price |
| currency | varchar(10) | Yes | 'USD' | ISO currency code |
| area_m2 | decimal(10,2) | No | null | Total area in m² |
| bedrooms | smallint | No | null | Number of bedrooms |
| bathrooms | smallint | No | null | Number of bathrooms |
| parking | smallint | No | null | Parking spots |
| address_line | varchar(500) | No | null | Street address |
| city | varchar(100) | Yes | — | City |
| state | varchar(100) | No | null | State/province |
| zip | varchar(20) | No | null | Postal code |
| country | varchar(5) | Yes | 'VE' | ISO country code |
| latitude | decimal(10,7) | No | null | GPS lat |
| longitude | decimal(10,7) | No | null | GPS lng |
| commission_rate | decimal(5,2) | No | '5.00' | Default commission % |
| contact_id | uuid | No | null | FK to customer_entities (owner/seller) |
| assigned_to | uuid | No | null | FK to users (agent) |
| notes | text | No | null | Internal notes |
| created_at | timestamptz | Yes | now() | — |
| updated_at | timestamptz | Yes | now() | — |
| deleted_at | timestamptz | No | null | Soft delete |

### Property Types

```
apartamento | casa | terreno | comercial | oficina | galpon | otro
```

### Operations

```
venta | alquiler | venta_alquiler
```

### Status Lifecycle

```
draft → active → reserved → sold | rented
                          → inactive (withdrawn)
active → inactive (any time)
```

- `draft`: Created but not published
- `active`: Available for showing/offers
- `reserved`: Under negotiation/contract
- `sold`: Sale completed (terminal)
- `rented`: Lease signed (terminal)
- `inactive`: Withdrawn from market

### `property_images`

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | Yes | gen_random_uuid() | PK |
| tenant_id | uuid | Yes | — | Multi-tenant |
| property_id | uuid | Yes | — | FK to properties |
| attachment_id | uuid | Yes | — | FK to attachments module |
| sort_order | smallint | Yes | 0 | Display order |
| is_cover | boolean | Yes | false | Cover image flag |
| created_at | timestamptz | Yes | now() | — |

Max 10 images per property. Uses the core `attachments` module for actual file storage (MinIO/S3/local). Only stores the reference and display metadata.

### `property_links`

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | Yes | gen_random_uuid() | PK |
| tenant_id | uuid | Yes | — | Multi-tenant |
| property_id | uuid | Yes | — | FK to properties |
| platform | varchar(30) | Yes | — | mercadolibre, facebook, instagram, otro |
| url | varchar(500) | Yes | — | External URL |
| label | varchar(100) | No | null | Display label |
| created_at | timestamptz | Yes | now() | — |

Max 5 links per property.

## API Endpoints

| Method | Path | Feature | Description |
|--------|------|---------|-------------|
| GET | /api/properties | properties.view | List with filters (type, operation, status, city, price range) |
| POST | /api/properties | properties.create | Create property |
| PUT | /api/properties | properties.edit | Update property |
| DELETE | /api/properties | properties.delete | Soft delete |
| GET | /api/properties/images | properties.view | List images for a property |
| POST | /api/properties/images | properties.edit | Add image (references attachments) |
| DELETE | /api/properties/images | properties.edit | Remove image |
| GET | /api/properties/links | properties.view | List links for a property |
| POST | /api/properties/links | properties.edit | Add external link |
| DELETE | /api/properties/links | properties.edit | Remove link |

## RBAC Features

```
properties.view        — Ver propiedades (employee default)
properties.create      — Crear propiedades (employee default)
properties.edit        — Editar propiedades (employee default)
properties.delete      — Eliminar propiedades (admin only)
properties.assign      — Asignar agente a propiedad (admin only)
```

## Admin Pages

| Path | Description |
|------|-------------|
| /backend/properties | List with DataTable (filters, search, bulk actions) |
| /backend/properties/create | Create form (all fields + image upload) |
| /backend/properties/[id] | Detail with tabs: Info, Images, Links, Documents, Matching |

## Events

```
properties.property.created    — New property added
properties.property.updated    — Property modified
properties.property.activated  — Status changed to active
properties.property.reserved   — Status changed to reserved
properties.property.sold       — Status changed to sold
properties.property.rented     — Status changed to rented
properties.property.deleted    — Property soft-deleted
```

## Search Configuration

Indexed fields for Meilisearch:
- title, description, city, state, address_line
- property_type, operation, status
- Filterable: property_type, operation, status, city, price range, bedrooms

## Integration Points

- **Contacts (customers)**: `contact_id` links to the property owner/seller
- **Attachments**: Images stored via core attachments module
- **Matching**: Properties feed into the matching engine
- **Transactions**: Closing references a property
- **Events**: Status changes emit events for workflow triggers

## Changelog

- 2026-05-18: Initial spec
