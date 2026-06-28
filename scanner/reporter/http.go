package reporter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/synchroiac/scanner/types"
)

// IngestPayload is the request body sent to the SynchroIaC ingest API.
type IngestPayload struct {
	ProjectID      string         `json:"project_id"`
	ScannerVersion string         `json:"scanner_version"`
	AWSRegion      string         `json:"aws_region"`
	Drifts         []DriftPayload `json:"drifts"`
	Summary        SummaryPayload `json:"summary"`
}

// DriftPayload is the JSON representation of a detected drift item.
type DriftPayload struct {
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	Attribute    string `json:"attribute"`
	DesiredValue string `json:"desired_value"`
	ActualValue  string `json:"actual_value"`
	DriftType    string `json:"drift_type"`
	RiskLevel    string `json:"risk_level"`
}

// SummaryPayload contains drift counts grouped by risk level.
type SummaryPayload struct {
	Total    int `json:"total"`
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
}

// PostReport sends drift detection results to the SynchroIaC API.
func PostReport(
	apiURL string,
	apiKey string,
	config types.ScanConfig,
	drifts []types.DriftItem,
	summary SummaryPayload,
) error {
	payload := IngestPayload{
		ProjectID:      config.ProjectID,
		ScannerVersion: config.ScannerVersion,
		AWSRegion:      config.AWSRegion,
		Drifts:         make([]DriftPayload, 0, len(drifts)),
		Summary:        summary,
	}

	for _, drift := range drifts {
		payload.Drifts = append(payload.Drifts, DriftPayload(drift))
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal ingest payload: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	endpoint := strings.TrimRight(apiURL, "/") + "/api/v1/ingest"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create ingest request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("post ingest report: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		responseBody, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("ingest API returned status %d and response body could not be read: %w", resp.StatusCode, readErr)
		}
		return fmt.Errorf("ingest API returned status %d: %s", resp.StatusCode, string(responseBody))
	}

	return nil
}
