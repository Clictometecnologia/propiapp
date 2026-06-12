import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Property } from '@/types';

const COLORS = {
  primary: '#0F766E',
  secondary: '#1E40AF',
  dark: '#1E293B',
  gray: '#475569',
  lightGray: '#F1F5F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
  accent: '#0D9488',
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
  },
  // HEADER
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 45,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  brandName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandTagline: {
    color: COLORS.white,
    fontSize: 8,
    opacity: 0.7,
    letterSpacing: 1,
    marginTop: 2,
  },
  headerComuna: {
    color: COLORS.white,
    fontSize: 9,
    opacity: 0.6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // HERO
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // PRICE BANNER
  priceBanner: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 22,
    paddingHorizontal: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLeft: {},
  priceLabel: {
    fontSize: 8,
    color: COLORS.white,
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceType: {
    fontSize: 10,
    color: COLORS.white,
    opacity: 0.8,
  },
  priceComuna: {
    fontSize: 8,
    color: COLORS.white,
    opacity: 0.6,
    marginTop: 2,
  },
  // SECTION
  section: {
    paddingHorizontal: 45,
    paddingTop: 30,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
  },
  // INFO GRID
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoCard: {
    width: '46%',
    marginRight: '4%',
    marginBottom: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  // DESCRIPTION
  descText: {
    fontSize: 9,
    color: COLORS.gray,
    lineHeight: 1.7,
    marginBottom: 18,
    textAlign: 'justify',
  },
  // AMENITIES
  amenityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  amenity: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // LOCATION CARD
  locationCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 7,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  // GALLERY
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  galleryImage: {
    width: '30%',
    height: 110,
    borderRadius: 4,
  },
  // CONTACT
  contactSection: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 45,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 8,
    color: '#94A3B8',
    marginBottom: 6,
  },
  contactItem: {
    fontSize: 8,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  contactBadge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  // FOOTER
  footer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: COLORS.white,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});

const formatUF = (value: number) =>
  value.toLocaleString('es-CL') + ' UF';

interface BrochurePDFProps {
  property: Property;
}

export default function BrochurePDF({ property }: BrochurePDFProps) {
  const primaryImage = property.images?.find(img => img.is_primary)?.image_url;
  const otherImages = property.images?.filter(img => !img.is_primary) || [];
  const allImageUrls = [
    ...(primaryImage ? [primaryImage] : []),
    ...otherImages.map(i => i.image_url),
  ];
  const displayImage = primaryImage || (property.images && property.images[0]?.image_url) || '';
  const hasLocation = property.lat != null && property.lng != null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>PROPIAPP</Text>
            <Text style={styles.brandTagline}>TU PRÓXIMO HOGAR COMIENZA AQUÍ</Text>
          </View>
          <Text style={styles.headerComuna}>{property.comuna}</Text>
        </View>

        {/* HERO IMAGE */}
        {displayImage ? (
          <Image style={styles.heroImage} src={displayImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>PROPIAPP</Text>
            <Text style={{ fontSize: 9, color: COLORS.gray, marginTop: 4 }}>{property.name}</Text>
          </View>
        )}

        {/* PRICE BANNER */}
        <View style={styles.priceBanner}>
          <View style={styles.priceLeft}>
            <Text style={styles.priceLabel}>Precio Desde</Text>
            <Text style={styles.priceValue}>{formatUF(property.precio_desde_uf)}</Text>
          </View>
          <View style={styles.priceRight}>
            <Text style={styles.priceType}>{property.tipologia}</Text>
            <Text style={styles.priceComuna}>{property.comuna}, Santiago</Text>
          </View>
        </View>

        {/* KEY INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Proyecto</Text>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 }}>
            {property.name}
          </Text>
          <Text style={{ fontSize: 9, color: COLORS.gray, marginBottom: 14 }}>
            {property.tipologia} — {property.comuna}, Región Metropolitana
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Dormitorios</Text>
              <Text style={styles.infoValue}>{property.dormitorios}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Baños</Text>
              <Text style={styles.infoValue}>{property.banos}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Bono Pie</Text>
              <Text style={styles.infoValue}>{property.bono_pie > 0 ? `${property.bono_pie}%` : 'No disponible'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Precio</Text>
              <Text style={styles.infoValue}>{formatUF(property.precio_desde_uf)}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Entrega</Text>
              <Text style={styles.infoValue}>
                {property.entrega_inmediata ? 'Inmediata' : 'A convenir'}
              </Text>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descText}>{property.descripcion}</Text>
        </View>

        {/* AMENITIES */}
        {property.amenidades.length > 0 && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <Text style={styles.sectionTitle}>Amenidades</Text>
            <View style={styles.amenityList}>
              {property.amenidades.map((amenity, i) => (
                <View key={i} style={styles.amenity}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* LOCATION */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Comuna</Text>
              <Text style={styles.locationValue}>{property.comuna}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Región</Text>
              <Text style={styles.locationValue}>Metropolitana de Santiago</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Dirección Referencial</Text>
              <Text style={styles.locationValue}>{property.comuna}, Santiago, Chile</Text>
            </View>
            {hasLocation && (
              <>
                <View style={[styles.locationRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
                  <Text style={styles.locationLabel}>Coordenadas</Text>
                  <Text style={styles.locationValue}>
                    {property.lat!.toFixed(5)}, {property.lng!.toFixed(5)}
                  </Text>
                </View>
                <View style={[styles.locationRow]}>
                  <Text style={styles.locationLabel}>Mapa</Text>
                  <Text style={[styles.locationValue, { fontSize: 8, color: COLORS.primary }]}>
                    Ver en línea: openstreetmap.org/?mlat={property.lat!.toFixed(5)}&mlon={property.lng!.toFixed(5)}&zoom=15
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* GALLERY */}
        {allImageUrls.length > 1 && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <Text style={styles.sectionTitle}>Galería</Text>
            <View style={styles.galleryRow}>
              {allImageUrls.slice(1, 4).map((url, i) => (
                <Image key={i} src={url} style={styles.galleryImage} />
              ))}
            </View>
          </View>
        )}

        {/* CONTACT */}
        <View style={styles.contactSection}>
          <View>
            <Text style={styles.contactName}>{property.ejecutivo_nombre}</Text>
            <Text style={styles.contactRole}>{property.ejecutivo_cargo}</Text>
            <Text style={styles.contactItem}>WhatsApp: {property.ejecutivo_whatsapp}</Text>
            <Text style={styles.contactItem}>Email: {property.ejecutivo_email}</Text>
          </View>
          <Text style={styles.contactBadge}>PROPIAPP</Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PROPIAPP.CL — {new Date().getFullYear()} — Todos los derechos reservados
          </Text>
        </View>
      </Page>
    </Document>
  );
}
