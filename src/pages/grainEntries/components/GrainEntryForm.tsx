import React from 'react';
import { Input, Button } from '../../../components/Shared/SharedComponents';
import type { GrainEntryFormData, CropClass, Region } from '../types/grainEntryTypes';

interface GrainEntryFormProps {
  formData: GrainEntryFormData;
  onFormDataChange: (data: GrainEntryFormData) => void;
  cropClasses: CropClass[];
  regions: Region[];
  loading: boolean;
}

export const GrainEntryForm: React.FC<GrainEntryFormProps> = ({
  formData,
  onFormDataChange,
  cropClasses,
  regions,
  loading
}) => {
  const handleInputChange = (field: keyof GrainEntryFormData, value: string | number) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date */}
        <div>
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            fullWidth
          />
        </div>

        {/* Crop Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Crop Class *
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading crop classes...</div>
          ) : cropClasses.length === 0 ? (
            <div className="text-sm text-gray-500">No crop classes available</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cropClasses.map((cropClass) => (
                <Button
                  key={cropClass.id}
                  variant={formData.cropClassId === cropClass.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('cropClassId', cropClass.id)}
                  disabled={loading}
                  className="text-xs"
                >
                  {cropClass.code || cropClass.name}
                </Button>
              ))}
            </div>
          )}
          {formData.cropClassId && cropClasses.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Selected: {cropClasses.find(c => c.id === formData.cropClassId)?.name}
            </div>
          )}
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Region
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading regions...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={formData.regionId === '' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('regionId', '')}
                disabled={loading}
                className="text-xs"
              >
                None
              </Button>
              {regions.length === 0 ? (
                <span className="text-sm text-gray-500">No regions available</span>
              ) : (
                regions.map((region) => (
                  <Button
                    key={region.id}
                    variant={formData.regionId === region.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('regionId', region.id)}
                    disabled={loading}
                    className="text-xs"
                  >
                    {region.name}
                  </Button>
                ))
              )}
            </div>
          )}
          {formData.regionId && regions.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Selected: {regions.find(r => r.id === formData.regionId)?.name}
              {formData.cropClassId && (
                <span className="text-gray-500"> (filtered by crop class)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};