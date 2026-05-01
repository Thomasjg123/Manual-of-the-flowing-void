## Metrics & Evaluation
To ensure the quality and controlled nature of the deviations, the following metrics will be tracked:

- **Structural Metrics**:
    - **Character Length**: Total characters in the prompt.
    - **Word Count**: Total words in the prompt.
- **Constraint Metrics**:
    - **Levenshtein Distance**: To verify the "minimal edit" constraint.
    - **Jaccard Similarity**: To measure vocabulary overlap.
- **Semantic Metrics**:
    - **Cosine Similarity**: Semantic closeness via Embedding Server.
    - **Semantic Drift**: Vector displacement magnitude.
- **Grammatical Metrics**:
    - **POS Consistency**: Comparing Part-of-Speech distributions to ensure structural integrity.

## Phase 0: Naive Shrinker (Baseline)
**Goal:** Establish a baseline by creating a script that simply asks the LLM to shorten a given prompt without any semantic or structural constraints.
- [ ] **Task 0.1: Naive Shrinker Implementation**
    - [ ] Create a Node.js script that takes a prompt as input.
    - [ ] Use the existing LLM interface to request a shorter version.
    - [ ] *Test:* Verify it produces a shorter string from a given input.

## Phase 1: Environment Setup
- [ ] Initialize project directory structure.
- [ ] Define and install dependencies (e.g., `spacy`, `gensim`, `numpy`, and LLM/Embedding clients).
- [ ] Setup testing framework (e.g., `pytest`).

## Phase 2: Word-level Perturbation (The Generator)
**Goal:** Replace a single word with a semantically similar neighbor while maintaining grammatical structure.
- [ ] **Task 2.1: POS Tagging**
    - [ ] Implement a module using `spaCy` to identify replaceable tokens (Nouns, Verbs, Adjectives).
    - [ ] *Test:* Ensure it correctly identifies parts of speech in various sentence structures.
- [ ] **Task 2.2: Semantic Neighbor Lookup**
    - [ ] Implement Word2Vec/FastText integration to find top-K nearest neighbors for a target word.
    - [ ] *Test:* Verify that "happy" returns "joyful", "cheerful", etc., and not "bicycle".
- [ ] **Task 2.3: Perturbation Engine**
    - [ ] Combine POS tagging and Word2Vec to produce a list of candidate sentences.
    - [ ] *Test:* Input a sentence, verify output sentences have exactly one word changed to a semantic neighbor.

## Phase 3: Similarity Filtering (The Gatekeeper)
**Goal:** Use the Embedding Server to prune candidates that are too similar or too different.
- [ ] **Task 3.1: Embedding Client**
    - [ ] Create a client to communicate with the existing Embedding Server.
    - [ ] *Test:* Successful retrieval of cosine similarity between two strings.
- [ ] **Task 3.2: Goldilocks Filter**
    - [ ] Implement logic to accept candidates within the similarity range (e.g., 0.90 - 0.98).
    - [ ] *Test:* Verify it rejects exact matches (1.0) and wildly different prompts (< 0.85).

## Phase 4: Semantic Validation (The Judge)
**Goal:** Use the LLM to ensure the "intent" of the prompt is preserved.
- [ ] **Task 4.1: LLM Integration**
    - [ ] Implement a client for the LLM.
    - [ ] *Test:* Basic prompt/response cycle.
- [ ] **Task 4.2: Intent Verification Prompt**
    - [ ] Develop the specific prompt for the LLM to judge "intent preservation".
    - [ ] *Test:* Pass a "bad" swap (e.g., "The dog ran" -> "The cat ran") and ensure LLM detects a change in meaning if required, or validates a "good" swap.

## Phase 5: Integrated Pipeline & Scaling
**Goal:** Combine all components into the final "Thousand Deviations" engine.
- [ ] **Task 5.1: Pipeline Integration**
    - [ ] Connect Generator -> Gatekeeper -> Judge.
    - [ ] *Test:* End-to-end flow: Original Prompt -> 1000 Deviations.
- [ ] **Task 5.2: Optimization & Batching**
    - [ ] Implement batch processing for the Embedding Server and LLM to improve throughput.
    - [ *Test:* Measure performance and scalability.
