# Contributing to Atlas

Thanks for checking out my project! If you want to help add or update Apple Store data, here is how to do it:

## Adding or Updating a Store

All stores are stored as JSON files in `packages/data/stores/`.

1. **Find or create the JSON file**:
   - The file name should match the format `apple-[store-id].json` (for example: `apple-champs-elysees.json`).
   - If you are adding a new store, check an existing file to see the structure.

2. **Validate your data**:
   - To make sure the JSON matches the schema, run the validation script from the root directory:
     ```bash
     npm run data:validate
     ```
   - If there are errors, the script will tell you what needs to be fixed.

3. **Submit your changes**:
   - Open a Pull Request! Keep your description simple, explaining what stores you added or updated.

## About Photos

- Please only use photos that you took yourself or that are free to use (Creative Commons, Public Domain, etc.).
- Make sure to fill in the `credit` and `license` fields in the JSON.
