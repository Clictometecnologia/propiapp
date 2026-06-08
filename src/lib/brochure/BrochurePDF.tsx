import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { Property } from '@/types';

const TEAL = '#0F766E';
const DARK = '#0F172A';
const GRAY = '#64748B';
const LIGHT = '#F8FAFC';
const MUTED = '#94A3B8';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },

  cover: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  coverContent: {
    position: 'absolute',
    bottom: 60,
    left: 50,
    right: 50,
  },
  coverTag: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.8,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 1.1,
  },
  coverLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  coverPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coverPriceUnit: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  coverBrand: {
    position: 'absolute',
    top: 40,
    left: 50,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  coverDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },

  section: {
    paddingHorizontal: 50,
    paddingTop: 40,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 8,
    letterSpacing: 3,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  sectionDivider: {
    width: 24,
    height: 1.5,
    backgroundColor: TEAL,
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginHorizontal: -6,
  },
  statCard: {
    width: '25%',
    padding: 6,
  },
  statBox: {
    backgroundColor: LIGHT,
    padding: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 7,
    letterSpacing: 1,
    color: GRAY,
    textTransform: 'uppercase',
  },

  descText: {
    fontSize: 9.5,
    color: GRAY,
    lineHeight: 1.8,
    marginBottom: 8,
  },

  amenitySection: {
    paddingHorizontal: 50,
    paddingBottom: 30,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityPill: {
    backgroundColor: LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenityText: {
    fontSize: 8,
    color: DARK,
    fontWeight: 'medium',
  },

  gallerySection: {
    paddingHorizontal: 50,
    paddingBottom: 30,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryImage: {
    flex: 1,
    height: 140,
  },

  contactSection: {
    backgroundColor: DARK,
    paddingHorizontal: 50,
    paddingVertical: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contactLeft: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 7,
    letterSpacing: 3,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  contactDivider: {
    width: 20,
    height: 1.5,
    backgroundColor: TEAL,
    marginBottom: 14,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 16,
  },
  contactLine: {
    fontSize: 9,
    color: '#CBD5E1',
    marginBottom: 3,
    lineHeight: 1.6,
  },
  contactRight: {
    alignItems: 'flex-end',
  },
  contactBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 4,
  },
  contactTagline: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
  },

  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
  },

  emptyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImageText: {
    fontSize: 14,
    color: GRAY,
    letterSpacing: 3,
  },
});

interface BrochurePDFProps {
  property: Property;
}

const formatUF = (v: number) =>
  `${v.toLocaleString('es-CL')} UF`;

export default function BrochurePDF({ property }: BrochurePDFProps) {
  const primaryImage = property.images?.find(img => img.is_primary)?.image_url;
  const otherImages = property.images?.filter(img => !img.is_primary) || [];
  const allImageUrls = [
    ...(primaryImage ? [primaryImage] : []),
    ...otherImages.map(i => i.image_url),
  ];
  const heroImage = primaryImage || (property.images && property.images[0]?.image_url) || '';
  const galleryImages = allImageUrls.slice(1, 4);

  return (
    <Document>
      {/* ─── Page 1: Cover ─── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          {heroImage ? (
            <Image style={styles.coverImage} src={heroImage} />
          ) : (
            <View style={styles.emptyImage}>
              <Text style={styles.emptyImageText}>PROPIAPP</Text>
            </View>
          )}
          <View style={styles.coverOverlay} />
          <View style={styles.coverGradient} />

          <Text style={styles.coverBrand}>PROPIAPP</Text>

          <View style={styles.coverContent}>
            <Text style={styles.coverTag}>{property.tipologia}</Text>
            <View style={styles.coverDivider} />
            <Text style={styles.coverTitle}>{property.name}</Text>
            <Text style={styles.coverLocation}>{property.comuna}</Text>
            <Text style={styles.coverPrice}>
              Desde {formatUF(property.precio_desde_uf)}{' '}
              <Text style={styles.coverPriceUnit}>UF</Text>
            </Text>
          </View>
        </View>
      </Page>

      {/* ─── Page 2: Details ─── */}
      <Page size="A4" style={styles.page}>
        {/* Key Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.sectionDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{property.dormitorios}</Text>
                <Text style={styles.statLabel}>Dormitorios</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{property.bono_pie}%</Text>
                <Text style={styles.statLabel}>Bono Pie</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {property.entrega_inmediata ? 'Inmediata' : 'A convenir'}
                </Text>
                <Text style={styles.statLabel}>Entrega</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatUF(property.precio_desde_uf)}</Text>
                <Text style={styles.statLabel}>Valor Desde</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.descText}>
            {property.descripcion || 'No hay descripción disponible para este proyecto.'}
          </Text>
        </View>

        {/* Amenities */}
        {property.amenidades.length > 0 && (
          <View style={styles.amenitySection}>
            <Text style={styles.sectionTitle}>Amenidades</Text>
            <View style={styles.sectionDivider} />
            <View style={styles.amenityRow}>
              {property.amenidades.map((a, i) => (
                <View key={i} style={styles.amenityPill}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Galería</Text>
            <View style={styles.sectionDivider} />
            <View style={styles.galleryRow}>
              {galleryImages.map((url, i) => (
                <Image key={i} style={styles.galleryImage} src={url} />
              ))}
            </View>
          </View>
        )}
      </Page>

      {/* ─── Page 3: Contact ─── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contactSection}>
          <View style={styles.contactLeft}>
            <Text style={styles.contactLabel}>Asesor Comercial</Text>
            <View style={styles.contactDivider} />
            <Text style={styles.contactName}>{property.ejecutivo_nombre || 'Asesor Comercial'}</Text>
            <Text style={styles.contactRole}>{property.ejecutivo_cargo || 'Ejecutivo de Proyectos'}</Text>
            <Text style={styles.contactLine}>WhatsApp: {property.ejecutivo_whatsapp}</Text>
            <Text style={styles.contactLine}>Email: {property.ejecutivo_email}</Text>
          </View>
          <View style={styles.contactRight}>
            <Text style={styles.contactBrand}>PROPIAPP</Text>
            <Text style={styles.contactTagline}>propiapp.cl</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PROPIAPP.CL &mdash; {new Date().getFullYear()} &mdash; Todos los derechos reservados
          </Text>
        </View>
      </Page>
    </Document>
  );
}