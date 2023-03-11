package main

import (
	"fmt"
	"image"
	"os"

	"github.com/azr/phash"

	_ "image/jpeg"

	"encoding/json"
	_ "image/png"
	"log"
	"net/http"
)

type empty struct{}
type semaphore chan empty

type HTTPError struct {
	Error string `json:"error"`
}

func phashHandler(w http.ResponseWriter, r *http.Request) {
	urls, ok := r.URL.Query()["url"]
	if !ok {
		jsonError(w, "Must provide url query params", http.StatusBadRequest)
		return
	}

	sem := make(semaphore, len(urls))
	result := make([]string, len(urls))
	errors := make([]error, 0)
	for i := range urls {
		go func(i int) {
			hash, err := getPHash(urls[i])
			if err != nil {
				errors = append(errors, err)
			}
			result[i] = hash
			sem <- empty{}
		}(i)
	}

	for i := 0; i < len(urls); i++ {
		<-sem
	}

	w.Header().Set("Cache-Control", "public, max-age=86400")
	jsonResponse(w, result)
}

func jsonError(w http.ResponseWriter, errMsg string, status int) {
	respType := HTTPError{Error: "Must provide url query params"}
	resp, err := json.Marshal(respType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	http.Error(w, string(resp), status)
}

func jsonResponse(w http.ResponseWriter, respType interface{}) {
	resp, err := json.Marshal(respType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "%s", resp)
}

func getPHash(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		log.Printf("Unable to fetch image at %s got %s\n", url, resp.Status)
		return "", fmt.Errorf("unable to fetch image")
	}

	// body, err := io.ReadAll(resp.Body)
	img, _, err := image.Decode(resp.Body)
	if err != nil {
		return "", err
	}

	hash := phash.DTC(img)
	return fmt.Sprintf("%b", hash), nil
}

func main() {
	http.HandleFunc("/phash", phashHandler)
	port := os.Getenv(("PORT"))
	if port == "" {
		port = ":8080"
	} else {
		port = ":" + port
	}

	log.Fatal(http.ListenAndServe(port, nil))
}
