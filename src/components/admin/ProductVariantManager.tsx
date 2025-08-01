'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { Variation, VariationValue, ProductVariant } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomSelect } from '@/components/ui/select-custom';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Package,
  ExternalLink,
} from 'lucide-react';

interface ProductVariantManagerProps {
  productId?: number;
  productName?: string;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

interface VariantFormData {
  sku: string;
  price_override?: number;
  offer_price_override?: number;
  quantity: number;
  variation_values: number[];
}

export default function ProductVariantManager({
  productId,
  productName = '',
  variants,
  onVariantsChange,
  disabled = false,
}: ProductVariantManagerProps) {
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFormData>({
    sku: '',
    price_override: undefined,
    offer_price_override: undefined,
    quantity: 0,
    variation_values: [],
  });
  const [selectedVariations, setSelectedVariations] = useState<{ [variationId: number]: number }>({});

  // const { showToast, showError, showSuccess } = useToast();
  const queryClient = useQueryClient();

  // Fetch variations and their values
  const { data: variations = [], isLoading: variationsLoading } = useQuery({
    queryKey: ['variations'],
    queryFn: () => adminApi.getVariations(),
  });

  const { data: allVariationValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['variation-values'],
    queryFn: () => adminApi.getVariationValues(),
  });

  // Fetch variants for the current product
  const { data: fetchedVariants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => productId ? adminApi.getProductVariants(productId) : [],
    enabled: !!productId,
  });

  // Update variants when fetched data changes
  useEffect(() => {
    if (fetchedVariants.length > 0) {
      onVariantsChange(fetchedVariants);
    }
  }, [fetchedVariants, onVariantsChange]);

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (data: VariantFormData & { product_id: number }) => {
      return adminApi.createProductVariant(data);
    },
    onSuccess: (newVariant) => {
      onVariantsChange([...variants, newVariant]);
      resetForm();
      toast.success('Product variant created successfully');
      // Invalidate and refetch variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create variant');
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VariantFormData & { product_id: number } }) =>
      adminApi.updateProductVariant(id, data),
    onSuccess: (updatedVariant) => {
      const updatedVariants = variants.map(v => v.id === updatedVariant.id ? updatedVariant : v);
      onVariantsChange(updatedVariants);
      setEditingVariantId(null);
      resetForm();
      toast.success('Product variant updated successfully');
      // Invalidate and refetch variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update variant');
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProductVariant(id),
    onSuccess: (_, deletedId) => {
      const updatedVariants = variants.filter(v => v.id !== deletedId);
      onVariantsChange(updatedVariants);
      toast.success('Product variant deleted successfully');
      // Invalidate and refetch variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete variant');
    },
  });

  const resetForm = () => {
    setVariantForm({
      sku: '',
      price_override: undefined,
      offer_price_override: undefined,
      quantity: 0,
      variation_values: [],
    });
    setSelectedVariations({});
    setIsAddingVariant(false);
    setEditingVariantId(null);
  };

  const handleVariationChange = (variationId: number, valueId: number) => {
    if (valueId === 0 || !valueId) {
      // Remove the variation if empty value is selected
      const newSelections = { ...selectedVariations };
      delete newSelections[variationId];
      setSelectedVariations(newSelections);
    } else {
      // Add or update the variation
      setSelectedVariations(prev => ({
        ...prev,
        [variationId]: valueId,
      }));
    }
    
    // Update the form with all selected variation values (filter out empty, null, and undefined ones)
    const updatedSelections = valueId === 0 || !valueId 
      ? { ...selectedVariations, [variationId]: undefined }
      : { ...selectedVariations, [variationId]: valueId };
    
    const newVariationValues = Object.values(updatedSelections)
      .filter(id => id !== undefined && id !== null && id !== 0) as number[];
    
    setVariantForm(prev => ({
      ...prev,
      variation_values: newVariationValues,
    }));
  };

  const handleSubmit = () => {
    if (!productId) {
      toast.error('Product must be saved before adding variants');
      return;
    }

    // Filter out any null, undefined, or 0 values from variation_values
    const filteredVariationValues = variantForm.variation_values.filter(
      id => id !== null && id !== undefined && id !== 0
    );

    if (filteredVariationValues.length === 0) {
      toast.error('Please select at least one variation');
      return;
    }

    if (!variantForm.sku.trim()) {
      toast.error('Please provide a SKU for the variant');
      return;
    }

    const data = {
      ...variantForm,
      variation_values: filteredVariationValues,
      product_id: productId,
    };

    if (editingVariantId) {
      updateVariantMutation.mutate({ id: editingVariantId, data });
    } else {
      createVariantMutation.mutate(data);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariantId(variant.id);
    // Don't set isAddingVariant to true - we'll edit inline
    
    setVariantForm({
      sku: variant.sku,
      price_override: variant.price_override ? parseFloat(variant.price_override) : undefined,
      offer_price_override: variant.offer_price_override ? parseFloat(variant.offer_price_override) : undefined,
      quantity: variant.quantity,
      variation_values: variant.variation_values.map(v => v.id),
    });

    // Set selected variations for the form
    const selections: { [variationId: number]: number } = {};
    variant.variation_values.forEach(value => {
      selections[value.variation_id] = value.id;
    });
    setSelectedVariations(selections);
  };

  const handleDelete = (variantId: number) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      deleteVariantMutation.mutate(variantId);
    }
  };

  const getVariationValuesForVariation = (variationId: number) => {
    return allVariationValues.filter(value => value.variation_id === variationId);
  };

  const formatVariantDisplay = (variant: ProductVariant) => {
    if (!variant || !variant.variation_values || !Array.isArray(variant.variation_values)) {
      return 'No variations';
    }
    
    return variant.variation_values
      .map(value => {
        if (!value || !value.variation || !value.name) return '';
        return `${value.variation.name}: ${value.name}`;
      })
      .filter(Boolean)
      .join(', ') || 'No variations';
  };

  const generateSKU = useCallback(() => {
    if (Object.keys(selectedVariations).length === 0 || !productId) return '';
    
    const productIdStr = productId.toString();
    const hmPrefix = 'HM';
    
    // Extract product name code (like "I1P" from "iPhone 15 Pro")
    const productNameCode = productName
      ? productName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 3) // Max 3 characters from product name for variants
      : 'PRD'; // Fallback if no product name
    
    // Get ALL variant codes from selected variations (no limit)
    const variantCode = Object.values(selectedVariations)
      .map(valueId => {
        const value = allVariationValues.find(v => v.id === valueId);
        if (!value) return '';
        
        // Extract meaningful characters from variant value
        const words = value.name.split(' ');
        if (words.length === 1) {
          // Single word like "Red" -> "R"
          return value.name.charAt(0).toUpperCase();
        } else {
          // Multiple words like "256GB" -> "2" (first digit/letter)
          return value.name.replace(/[^A-Z0-9]/gi, '').charAt(0).toUpperCase();
        }
      })
      .filter(Boolean)
      .join(''); // No limit on variant characters
    
    // Format: HM{productNameCode}{variantCode}XX{productId}
    let sku = `${hmPrefix}${productNameCode}${variantCode}`;
    
    // Calculate how much space we have before adding product ID
    const currentLength = sku.length;
    const minTotalLength = 10;
    const maxTotalLength = 12;
    
    // If we're already at or near max length, just add product ID
    if (currentLength + productIdStr.length >= maxTotalLength) {
      sku = `${sku}${productIdStr}`;
      // Trim to max 12 if needed
      return sku.length > maxTotalLength ? sku.substring(0, maxTotalLength) : sku;
    }
    
    // Calculate padding needed to reach minimum 10 characters
    const withProductId = currentLength + productIdStr.length;
    if (withProductId < minTotalLength) {
      const paddingNeeded = minTotalLength - withProductId;
      const padding = 'X'.repeat(paddingNeeded);
      sku = `${sku}${padding}${productIdStr}`;
    } else {
      sku = `${sku}${productIdStr}`;
    }
    
    return sku;
  }, [selectedVariations, productId, productName, allVariationValues]);  // Auto-generate SKU when variations change
  useEffect(() => {
    if (Object.keys(selectedVariations).length > 0 && productId && productName) {
      const generatedSKU = generateSKU();
      if (generatedSKU) {
        setVariantForm(prev => ({ ...prev, sku: generatedSKU }));
      }
    }
  }, [selectedVariations, productId, productName, allVariationValues, generateSKU]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Variants
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage different variations of this product (size, color, etc.)
              {variations.length === 0 && (
                <span className="block mt-2">
                  <a 
                    href="/admin/variations" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                  >
                    Create variations first <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              )}
            </CardDescription>
          </div>
          {!isAddingVariant && (
            <Button
              type="button"
              onClick={() => setIsAddingVariant(true)}
              disabled={disabled || !productId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              title={!productId ? "Save the product first to add variants" : "Add a new product variant"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Variant Form */}
        {isAddingVariant && (
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {editingVariantId ? 'Edit Variant' : 'Add New Variant'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Variation Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variations.map(variation => (
                    <div key={variation.id}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {variation.name} *
                      </label>
                      <CustomSelect
                        value={selectedVariations[variation.id]?.toString() || ''}
                        onValueChange={(value) => handleVariationChange(variation.id, parseInt(value as string))}
                        placeholder={`Select ${variation.name}`}
                        options={[
                          { value: '', label: `Select ${variation.name}` },
                          ...getVariationValuesForVariation(variation.id).map(value => ({
                            value: value.id.toString(),
                            label: value.name,
                          })),
                        ]}
                      />
                    </div>
                  ))}
                </div>

                {/* Variant Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SKU *
                    </label>
                    <Input
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Enter variant SKU"
                      required
                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price Override
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={variantForm.price_override || ''}
                      onChange={(e) => setVariantForm(prev => ({ 
                        ...prev, 
                        price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="Leave empty to use product price"
                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Offer Price Override
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={variantForm.offer_price_override || ''}
                      onChange={(e) => setVariantForm(prev => ({ 
                        ...prev, 
                        offer_price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="Leave empty to use product sale price"
                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={variantForm.quantity}
                      onChange={(e) => setVariantForm(prev => ({ 
                        ...prev, 
                        quantity: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0"
                      required
                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-500 text-gray-300 hover:bg-gray-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createVariantMutation.isPending || updateVariantMutation.isPending ? 
                      'Saving...' : 
                      (editingVariantId ? 'Update' : 'Add') + ' Variant'
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Variants List */}
        {variants.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Existing Variants</h4>
            {variants.map((variant) => (
              <Card key={variant.id} className="bg-gray-700 border-gray-600">
                <CardContent className="py-4">
                  {editingVariantId === variant.id ? (
                    // Inline Edit Form
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-white font-medium">Edit Variant</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetForm}
                          className="border-gray-500 text-gray-300 hover:bg-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Variation Selectors */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {variations.map(variation => (
                          <div key={variation.id}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {variation.name} *
                            </label>
                            <CustomSelect
                              value={selectedVariations[variation.id]?.toString() || ''}
                              onValueChange={(value) => handleVariationChange(variation.id, parseInt(value as string))}
                              placeholder={`Select ${variation.name}`}
                              options={[
                                { value: '', label: `Select ${variation.name}` },
                                ...getVariationValuesForVariation(variation.id).map(value => ({
                                  value: value.id.toString(),
                                  label: value.name,
                                })),
                              ]}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Variant Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            SKU *
                          </label>
                          <Input
                            value={variantForm.sku}
                            onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                            placeholder="Enter variant SKU"
                            required
                            className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Price Override
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variantForm.price_override || ''}
                            onChange={(e) => setVariantForm(prev => ({ 
                              ...prev, 
                              price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            placeholder="Leave empty to use product price"
                            className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Offer Price Override
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variantForm.offer_price_override || ''}
                            onChange={(e) => setVariantForm(prev => ({ 
                              ...prev, 
                              offer_price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            placeholder="Leave empty to use product sale price"
                            className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Quantity *
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={variantForm.quantity}
                            onChange={(e) => setVariantForm(prev => ({ 
                              ...prev, 
                              quantity: parseInt(e.target.value) || 0 
                            }))}
                            placeholder="0"
                            required
                            className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Edit Form Actions */}
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetForm}
                          className="border-gray-500 text-gray-300 hover:bg-gray-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={updateVariantMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateVariantMutation.isPending ? 'Updating...' : 'Update Variant'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal Display
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-white font-medium">{variant.sku}</p>
                            <p className="text-gray-400 text-sm">
                              {formatVariantDisplay(variant)}
                            </p>
                          </div>
                          <div className="text-gray-300">
                            <p className="text-sm">
                              Price: {variant.price_override ? `$${variant.price_override}` : 'Inherits product price'}
                            </p>
                            <p className="text-sm">
                              Offer Price: {variant.offer_price_override ? `$${variant.offer_price_override}` : 'Inherits product sale price'}
                            </p>
                            <p className="text-sm">Quantity: {variant.quantity}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(variant)}
                          disabled={disabled}
                          className="border-gray-500 text-gray-300 hover:bg-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                          disabled={disabled || deleteVariantMutation.isPending}
                          className="border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {!productId ? (
              <>
                <p>Save the product first to manage variants</p>
                <p className="text-sm">Product variants require the base product to be created</p>
              </>
            ) : (
              <>
                <p>No variants created yet</p>
                <p className="text-sm">Add variants to offer different options for this product</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}