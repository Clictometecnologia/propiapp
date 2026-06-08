'use server';

import { db } from '@/services/db';
import { Property, PropertyImage, Lead } from '@/types';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase-server';

// --- Client Tracking Actions ---

export async function trackViewAction(propertyId: string) {
  try {
    await db.trackPropertyView(propertyId);
    return { success: true };
  } catch (error) {
    console.error('Failed to track view:', error);
    return { success: false, error: String(error) };
  }
}

export async function trackWhatsappClickAction(propertyId: string) {
  try {
    await db.trackWhatsappClick(propertyId);
    return { success: true };
  } catch (error) {
    console.error('Failed to track WhatsApp click:', error);
    return { success: false, error: String(error) };
  }
}

export async function trackBrochureDownloadAction(propertyId: string) {
  try {
    await db.trackBrochureDownload(propertyId);
    return { success: true };
  } catch (error) {
    console.error('Failed to track brochure download:', error);
    return { success: false, error: String(error) };
  }
}

export async function createLeadAction(leadData: Omit<Lead, 'id' | 'created_at'>) {
  try {
    const newLead = await db.createLead(leadData);
    revalidatePath('/admin/leads');
    return { success: true, lead: newLead };
  } catch (error) {
    console.error('Failed to create lead:', error);
    return { success: false, error: String(error) };
  }
}

// --- Admin CRUD Actions ---

export async function createPropertyAction(
  propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'>,
  imagesData: Omit<PropertyImage, 'id' | 'property_id'>[]
) {
  try {
    await requireAuth();
    const newProperty = await db.createProperty(propertyData, imagesData);
    revalidatePath('/');
    revalidatePath('/admin/propiedades');
    return { success: true, property: newProperty };
  } catch (error) {
    console.error('Failed to create property:', error);
    return { success: false, error: String(error) };
  }
}

export async function togglePublishAction(id: string, published: boolean) {
  try {
    await requireAuth();
    await db.updateProperty(id, { published });
    revalidatePath('/');
    revalidatePath('/admin/propiedades');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle publish:', error);
    return { success: false, error: String(error) };
  }
}

export async function updatePropertyAction(
  id: string,
  propertyData: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at' | 'images'>>,
  imagesData?: Omit<PropertyImage, 'id' | 'property_id'>[]
) {
  try {
    await requireAuth();
    const updatedProperty = await db.updateProperty(id, propertyData, imagesData);
    revalidatePath('/');
    revalidatePath(`/propiedades/${updatedProperty.slug}`);
    revalidatePath('/admin/propiedades');
    return { success: true, property: updatedProperty };
  } catch (error) {
    console.error('Failed to update property:', error);
    return { success: false, error: String(error) };
  }
}

export async function deletePropertyAction(id: string) {
  try {
    await requireAuth();
    const success = await db.deleteProperty(id);
    revalidatePath('/');
    revalidatePath('/admin/propiedades');
    return { success };
  } catch (error) {
    console.error('Failed to delete property:', error);
    return { success: false, error: String(error) };
  }
}

export async function duplicatePropertyAction(id: string) {
  try {
    await requireAuth();
    const newProperty = await db.duplicateProperty(id);
    revalidatePath('/admin/propiedades');
    return { success: true, property: newProperty };
  } catch (error) {
    console.error('Failed to duplicate property:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateLeadStatusAction(id: string, status: Lead['estado']) {
  try {
    await requireAuth();
    const updatedLead = await db.updateLeadStatus(id, status);
    revalidatePath('/admin/leads');
    return { success: true, lead: updatedLead };
  } catch (error) {
    console.error('Failed to update lead status:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateLeadObservationAction(id: string, observacion: string) {
  try {
    await requireAuth();
    const updatedLead = await db.updateLeadObservation(id, observacion);
    revalidatePath('/admin/leads');
    return { success: true, lead: updatedLead };
  } catch (error) {
    console.error('Failed to update lead observation:', error);
    return { success: false, error: String(error) };
  }
}

export async function createLeadAdminAction(leadData: Omit<Lead, 'id' | 'created_at'>) {
  try {
    await requireAuth();
    const newLead = await db.createLead(leadData);
    revalidatePath('/admin/leads');
    return { success: true, lead: newLead };
  } catch (error) {
    console.error('Failed to create lead:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateLeadAction(id: string, data: Partial<Omit<Lead, 'id' | 'created_at' | 'property_name'>>) {
  try {
    await requireAuth();
    const updatedLead = await db.updateLead(id, data);
    revalidatePath('/admin/leads');
    return { success: true, lead: updatedLead };
  } catch (error) {
    console.error('Failed to update lead:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteLeadAction(id: string) {
  try {
    await requireAuth();
    await db.deleteLead(id);
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return { success: false, error: String(error) };
  }
}
