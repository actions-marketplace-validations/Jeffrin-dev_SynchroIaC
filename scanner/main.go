package main

import (
	"context"
	"log"
	"os"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/synchroiac/scanner/aws"
	"github.com/synchroiac/scanner/diff"
	"github.com/synchroiac/scanner/reporter"
	"github.com/synchroiac/scanner/terraform"
	"github.com/synchroiac/scanner/types"
)

func main() {
	ctx := context.Background()
	config := loadConfig()

	log.Printf("SynchroIaC scanner starting: region=%s terraform_path=%s", config.AWSRegion, config.TerraformPath)

	stateFile, err := terraform.FindStateFile(config.TerraformPath)
	if err != nil {
		log.Fatalf("failed to find Terraform state: %v", err)
	}
	desired, err := terraform.ParseStateFile(stateFile)
	if err != nil {
		log.Fatalf("failed to parse Terraform state: %v", err)
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(config.AWSRegion))
	if err != nil {
		log.Fatalf("failed to load AWS config: %v", err)
	}

	actual := make([]types.ResourceState, 0)
	var mu sync.Mutex
	var wg sync.WaitGroup

	scanners := []struct {
		name string
		scan func(context.Context) ([]types.ResourceState, error)
	}{
		{name: "EC2", scan: func(ctx context.Context) ([]types.ResourceState, error) { return aws.ScanEC2(ctx, cfg) }},
		{name: "S3", scan: func(ctx context.Context) ([]types.ResourceState, error) { return aws.ScanS3(ctx, cfg) }},
		{name: "IAM", scan: func(ctx context.Context) ([]types.ResourceState, error) { return aws.ScanIAM(ctx, cfg) }},
	}

	for _, scanner := range scanners {
		scanner := scanner
		wg.Add(1)
		go func() {
			defer wg.Done()
			results, err := scanner.scan(ctx)
			if err != nil {
				log.Printf("warning: %s scanner failed: %v", scanner.name, err)
				return
			}

			mu.Lock()
			actual = append(actual, results...)
			mu.Unlock()
		}()
	}
	wg.Wait()

	drifts := diff.DetectDrift(desired, actual)
	total, critical, high, medium, low := diff.ScanSummary(drifts)

	log.Printf("Drift detection complete: %d total drifts (%d critical, %d high, %d medium, %d low)", total, critical, high, medium, low)

	if len(drifts) == 0 {
		log.Println("No drift detected. Exiting cleanly.")
		os.Exit(0)
	}

	summary := reporter.SummaryPayload{Total: total, Critical: critical, High: high, Medium: medium, Low: low}
	if err := reporter.PostReport(config.APIURL, config.APIKey, config, drifts, summary); err != nil {
		log.Fatalf("failed to post report: %v", err)
	}

	log.Println("Report posted successfully.")
}

func loadConfig() types.ScanConfig {
	apiKey := os.Getenv("SYNCHROIAC_API_KEY")
	if apiKey == "" {
		log.Println("SYNCHROIAC_API_KEY is required")
		os.Exit(1)
	}

	projectID := os.Getenv("SYNCHROIAC_PROJECT_ID")
	if projectID == "" {
		log.Println("SYNCHROIAC_PROJECT_ID is required")
		os.Exit(1)
	}

	return types.ScanConfig{
		APIURL:         envOrDefault("SYNCHROIAC_API_URL", "https://synchroiac.vercel.app"),
		APIKey:         apiKey,
		ProjectID:      projectID,
		TerraformPath:  envOrDefault("TERRAFORM_PATH", "./terraform"),
		AWSRegion:      envOrDefault("AWS_REGION", "us-east-1"),
		ScannerVersion: envOrDefault("SCANNER_VERSION", "0.1.0"),
	}
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
