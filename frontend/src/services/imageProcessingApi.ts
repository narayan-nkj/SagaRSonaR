const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface QualityAssessment {
  overallScore: number;
  category: 'excellent' | 'good' | 'moderate' | 'poor';
  speckleNoise: 'low' | 'medium' | 'high';
  dataDropoutPercentage: number;
  imageCoveragePercentage: number;
  motionDistortion: 'low' | 'medium' | 'high' | 'unavailable';
  shadowVisibility: 'poor' | 'fair' | 'good' | 'unavailable';
  missingRegionPercentage: number;
  contrastScore: number;
  signalQuality: number;
  warnings: string[];
}

export interface MaskStatistics {
  usablePercentage: number;
  uncertainPercentage: number;
  ignoredPercentage: number;
  missingPercentage: number;
  shadowPercentage: number;
}

export interface RegionCandidate {
  id: string;
  label: 'likely_object' | 'likely_shadow' | 'natural_seabed_feature' | 'uncertain';
  objectConfidence: number;
  shadowConfidence: number;
  uncertainty: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  features: any;
  explanation: string;
}

export interface ImageProcessingJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'assessed' | 'completed' | 'failed';
  progress: number;
  stage: string;
  originalImageUrl?: string;
  processedImageUrl?: string;
  qualityMaskUrl?: string;
  inferenceMaskUrl?: string;
  shadowOverlayUrl?: string;
  qualityAssessment?: QualityAssessment;
  maskStatistics?: MaskStatistics;
  regionAnalysis?: RegionCandidate[];
  metadata?: any;
  processingDurationMs?: number;
  warnings?: string[];
}

export const imageProcessingApi = {
  createJob: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },
  
  getJobStatus: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },
  
  getJobResult: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}/result`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch result');
    return res.json();
  },
  
  getJobHistory: async (): Promise<ImageProcessingJobResponse[]> => {
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/history`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to fetch job history');
    return res.json();
  },

  analyzeJob: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to analyze job');
    return res.json();
  },

  deleteJob: async (jobId: string): Promise<void> => {
    const token = sessionStorage.getItem('sagar_token');
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to delete job');
  }
};
