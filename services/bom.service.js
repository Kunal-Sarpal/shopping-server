import { BOM, RawMaterial } from '../models/Manufacturing.js';

// Calculate material requirements and costs for a given planned production quantity
export const calculateBOMRequirements = async (bomId, plannedQuantity) => {
  const bom = await BOM.findById(bomId).populate('items.material_id');
  if (!bom) throw new Error('BOM not found');

  const requirements = bom.items.map(item => {
    const rawMaterial = item.material_id;
    const baseQty = item.quantity * plannedQuantity;
    const scrapFactor = 1 + ((item.scrap_percent || 0) / 100);
    const totalRequiredQty = parseFloat((baseQty * scrapFactor).toFixed(4));
    const unitCost = rawMaterial?.cost_per_unit || 0;
    const totalEstimatedCost = parseFloat((totalRequiredQty * unitCost).toFixed(2));

    return {
      material_id: rawMaterial?._id || item.material_id,
      material_code: rawMaterial?.material_code || '',
      material_name: rawMaterial?.name || item.material_name,
      material_type: rawMaterial?.material_type || 'Fabric',
      unit: item.unit,
      unit_cost: unitCost,
      base_quantity: baseQty,
      scrap_percent: item.scrap_percent || 0,
      total_required_quantity: totalRequiredQty,
      total_estimated_cost: totalEstimatedCost
    };
  });

  const totalMaterialCost = requirements.reduce((sum, r) => sum + r.total_estimated_cost, 0);
  const totalLaborCost = (bom.estimated_labor_cost || 0) * plannedQuantity;
  const totalProductionCost = totalMaterialCost + totalLaborCost;
  const estimatedUnitCost = plannedQuantity > 0 ? parseFloat((totalProductionCost / plannedQuantity).toFixed(2)) : 0;

  return {
    bom_id: bom._id,
    bom_number: bom.bom_number,
    version: bom.version,
    planned_quantity: plannedQuantity,
    requirements,
    financials: {
      total_material_cost: totalMaterialCost,
      total_labor_cost: totalLaborCost,
      total_production_cost: totalProductionCost,
      estimated_unit_cost: estimatedUnitCost
    }
  };
};
