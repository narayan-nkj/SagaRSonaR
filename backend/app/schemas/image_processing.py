from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class QualityAssessment(BaseModel):
    overallScore: float = Field(..., alias="overallScore")
    category: str
    speckleNoise: str = Field(..., alias="speckleNoise")
    dataDropoutPercentage: float = Field(..., alias="dataDropoutPercentage")
    imageCoveragePercentage: float = Field(..., alias="imageCoveragePercentage")
    motionDistortion: str = Field(..., alias="motionDistortion")
    shadowVisibility: str = Field(..., alias="shadowVisibility")
    missingRegionPercentage: float = Field(..., alias="missingRegionPercentage")
    contrastScore: float = Field(..., alias="contrastScore")
    signalQuality: float = Field(..., alias="signalQuality")
    warnings: List[str]

    class Config:
        populate_by_name = True

class MaskStatistics(BaseModel):
    usablePercentage: float = Field(..., alias="usablePercentage")
    uncertainPercentage: float = Field(..., alias="uncertainPercentage")
    ignoredPercentage: float = Field(..., alias="ignoredPercentage")
    missingPercentage: float = Field(..., alias="missingPercentage")
    shadowPercentage: float = Field(..., alias="shadowPercentage")

    class Config:
        populate_by_name = True

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class CandidateFeatures(BaseModel):
    brightnessReturn: float = Field(..., alias="brightnessReturn")
    shadowContinuity: float = Field(..., alias="shadowContinuity")
    shapeScore: float = Field(..., alias="shapeScore")
    textureScore: float = Field(..., alias="textureScore")
    seabedSimilarity: float = Field(..., alias="seabedSimilarity")

    class Config:
        populate_by_name = True

class RegionCandidate(BaseModel):
    id: str
    label: str
    objectConfidence: float = Field(..., alias="objectConfidence")
    shadowConfidence: float = Field(..., alias="shadowConfidence")
    uncertainty: float
    boundingBox: BoundingBox = Field(..., alias="boundingBox")
    features: CandidateFeatures
    explanation: str

    class Config:
        populate_by_name = True

class MetadataInfo(BaseModel):
    originalWidth: int = Field(..., alias="originalWidth")
    originalHeight: int = Field(..., alias="originalHeight")
    processedWidth: int = Field(..., alias="processedWidth")
    processedHeight: int = Field(..., alias="processedHeight")
    normalizationMethod: str = Field(..., alias="normalizationMethod")
    noiseReductionMethod: str = Field(..., alias="noiseReductionMethod")
    contrastMethod: str = Field(..., alias="contrastMethod")
    resizeMethod: str = Field(..., alias="resizeMethod")
    processingVersion: str = Field(..., alias="processingVersion")

    class Config:
        populate_by_name = True

class ImageProcessingJobResponse(BaseModel):
    jobId: str = Field(..., alias="jobId")
    status: str
    progress: int
    stage: str
    originalImageUrl: Optional[str] = Field(None, alias="originalImageUrl")
    processedImageUrl: Optional[str] = Field(None, alias="processedImageUrl")
    qualityMaskUrl: Optional[str] = Field(None, alias="qualityMaskUrl")
    inferenceMaskUrl: Optional[str] = Field(None, alias="inferenceMaskUrl")
    shadowOverlayUrl: Optional[str] = Field(None, alias="shadowOverlayUrl")
    
    qualityAssessment: Optional[QualityAssessment] = Field(None, alias="qualityAssessment")
    maskStatistics: Optional[MaskStatistics] = Field(None, alias="maskStatistics")
    regionAnalysis: Optional[List[RegionCandidate]] = Field(None, alias="regionAnalysis")
    metadata: Optional[MetadataInfo] = None
    processingDurationMs: Optional[int] = Field(None, alias="processingDurationMs")
    warnings: Optional[List[str]] = None

    class Config:
        populate_by_name = True

class JobCreateResponse(BaseModel):
    jobId: str = Field(..., alias="jobId")
    status: str
    createdAt: datetime = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True
