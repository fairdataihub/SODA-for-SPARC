// Purpose: Field validation for contributors. Includes regex pattern from sparcur 3.0.0 schemas.py
// r'^((([Vv](an|on))|[Dd][ia]|([Dd]e( [Ll]os)?)) )?[^, ]+, [^,]+$'

export const CONTRIBUTORS_REGEX = /^((([Vv](an|on))|[Dd][ia]|([Dd]e( [Ll]os)?)) )?[^, ]+, [^,]+$/;
