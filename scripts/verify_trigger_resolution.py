import json


DEFAULT_REF = "main"
DEFAULT_PATH = "data/resume.json"


def resolve_source_coordinates(event_name, dispatch_inputs=None, dispatch_payload=None):
    dispatch_inputs = dispatch_inputs or {}
    dispatch_payload = dispatch_payload or {}

    profile_data_ref = ""
    profile_data_path = ""

    if event_name == "workflow_dispatch":
        profile_data_ref = dispatch_inputs.get("profile_data_ref", "")
        profile_data_path = dispatch_inputs.get("profile_data_path", "")
    elif event_name == "repository_dispatch":
        profile_data_ref = dispatch_payload.get("profile_data_ref", "")
        profile_data_path = dispatch_payload.get("profile_data_path", "")

    if not profile_data_ref:
        profile_data_ref = DEFAULT_REF
    if not profile_data_path:
        profile_data_path = DEFAULT_PATH

    return {
        "profile_data_ref": profile_data_ref,
        "profile_data_path": profile_data_path,
    }


def assert_case(name, event_name, expected_ref, expected_path, dispatch_inputs=None, dispatch_payload=None):
    result = resolve_source_coordinates(
        event_name=event_name,
        dispatch_inputs=dispatch_inputs,
        dispatch_payload=dispatch_payload,
    )

    assert result["profile_data_ref"] == expected_ref, (
        f"{name}: expected ref '{expected_ref}', got '{result['profile_data_ref']}'"
    )
    assert result["profile_data_path"] == expected_path, (
        f"{name}: expected path '{expected_path}', got '{result['profile_data_path']}'"
    )

    print(
        json.dumps(
            {
                "case": name,
                "status": "passed",
                "resolved": result,
            },
            separators=(",", ":"),
        )
    )


def main():
    assert_case(
        name="workflow_dispatch_non_default_ref",
        event_name="workflow_dispatch",
        expected_ref="release/candidate",
        expected_path="data/resume.json",
        dispatch_inputs={
            "profile_data_ref": "release/candidate",
            "profile_data_path": "data/resume.json",
        },
    )

    assert_case(
        name="repository_dispatch_defaults",
        event_name="repository_dispatch",
        expected_ref=DEFAULT_REF,
        expected_path=DEFAULT_PATH,
        dispatch_payload={},
    )

    assert_case(
        name="repository_dispatch_explicit_values",
        event_name="repository_dispatch",
        expected_ref="feature/resume-update",
        expected_path="data/alt-resume.json",
        dispatch_payload={
            "profile_data_ref": "feature/resume-update",
            "profile_data_path": "data/alt-resume.json",
        },
    )

    print("Trigger resolution verification checks passed.")


if __name__ == "__main__":
    main()
