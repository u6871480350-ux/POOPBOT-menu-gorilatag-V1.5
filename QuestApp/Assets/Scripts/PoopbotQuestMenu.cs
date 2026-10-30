using UnityEngine;
using UnityEngine.XR;

/// <summary>
/// Standalone Quest demo: a floating 3D troll-book menu.
/// A toggles the book; point with the right controller and press Trigger to tap.
/// This app does not connect to or modify Gorilla Tag.
/// </summary>
public sealed class PoopbotQuestMenu : MonoBehaviour
{
    private GameObject book;
    private Transform head;
    private InputDevice rightHand;
    private bool wasA;
    private bool wasTrigger;
    private AudioSource audioSource;
    private float nextHapticTime;

    private static readonly Color Cyan = new Color(0.10f, 0.85f, 1f);
    private static readonly Color Dark = new Color(0.025f, 0.045f, 0.09f);
    private static readonly string[] Labels =
    {
        "BAN HAMMER (FAKE)", "INFINITE BANANAS", "ADMIN? NAH", "TROLL MODE",
        "LOUD BONK", "CONFETTI EXPLOSION"
    };

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Create()
    {
        if (FindObjectOfType<PoopbotQuestMenu>() != null) return;
        var host = new GameObject("POOPBOT V2");
        host.AddComponent<PoopbotQuestMenu>();
    }

    private void Start()
    {
        head = Camera.main != null ? Camera.main.transform : null;
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.spatialBlend = 0f;
        audioSource.playOnAwake = false;
        BuildBook();
        book.SetActive(false);
        RefreshRightHand();
    }

    private void Update()
    {
        if (head == null && Camera.main != null) head = Camera.main.transform;
        RefreshRightHand();

        bool a = rightHand.isValid && rightHand.TryGetFeatureValue(CommonUsages.primaryButton, out bool aValue) && aValue;
        if (a && !wasA)
        {
            book.SetActive(!book.activeSelf);
            if (book.activeSelf) PlayTone(740f, 0.08f);
        }
        wasA = a;

        if (book.activeSelf && head != null)
        {
            Vector3 forward = Vector3.ProjectOnPlane(head.forward, Vector3.up).normalized;
            if (forward.sqrMagnitude < 0.01f) forward = head.forward;
            Vector3 target = head.position + forward * 0.82f + Vector3.down * 0.12f;
            book.transform.position = Vector3.Lerp(book.transform.position, target, Time.deltaTime * 8f);
            Quaternion face = Quaternion.LookRotation(forward, Vector3.up);
            book.transform.rotation = Quaternion.Slerp(book.transform.rotation, face, Time.deltaTime * 8f);
        }

        bool trigger = rightHand.isValid && rightHand.TryGetFeatureValue(CommonUsages.triggerButton, out bool triggerValue) && triggerValue;
        if (trigger && !wasTrigger && book.activeSelf) TryPressButton();
        wasTrigger = trigger;
    }

    private void RefreshRightHand()
    {
        if (rightHand.isValid) return;
        rightHand = InputDevices.GetDeviceAtXRNode(XRNode.RightHand);
    }

    private void BuildBook()
    {
        book = new GameObject("POOPBOT floating troll book");
        CreateCube(book.transform, "Back cover", Vector3.zero, new Vector3(0.72f, 0.48f, 0.055f), new Color(0.015f, 0.08f, 0.15f));
        CreateCube(book.transform, "Left page", new Vector3(-0.18f, 0f, 0.035f), new Vector3(0.34f, 0.43f, 0.018f), Dark);
        CreateCube(book.transform, "Right page", new Vector3(0.18f, 0f, 0.035f), new Vector3(0.34f, 0.43f, 0.018f), Dark);
        CreateText(book.transform, "POOPBOT V2", new Vector3(0f, 0.17f, 0.055f), 0.052f, Cyan, TextAnchor.MiddleCenter);
        CreateText(book.transform, "100% FAKE TROLL MENU", new Vector3(0f, 0.105f, 0.055f), 0.022f, Color.white, TextAnchor.MiddleCenter);

        for (int i = 0; i < Labels.Length; i++)
        {
            int col = i % 2;
            int row = i / 2;
            float x = col == 0 ? -0.18f : 0.18f;
            float y = 0.015f - row * 0.105f;
            var button = CreateCube(book.transform, "Troll button " + i, new Vector3(x, y, 0.065f), new Vector3(0.30f, 0.075f, 0.025f), new Color(0.02f, 0.16f, 0.24f));
            button.AddComponent<BoxCollider>();
            var action = button.AddComponent<PoopbotTrollButton>();
            action.Initialize(this, Labels[i]);
            CreateText(button.transform, Labels[i], new Vector3(0f, 0f, 0.018f), 0.018f, Color.white, TextAnchor.MiddleCenter);
        }
        CreateText(book.transform, "A = CLOSE  |  POINT + TRIGGER = PRESS", new Vector3(0f, -0.215f, 0.055f), 0.018f, Cyan, TextAnchor.MiddleCenter);
    }

    private GameObject CreateCube(Transform parent, string name, Vector3 localPosition, Vector3 scale, Color color)
    {
        var obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.name = name;
        obj.transform.SetParent(parent, false);
        obj.transform.localPosition = localPosition;
        obj.transform.localScale = scale;
        var renderer = obj.GetComponent<Renderer>();
        renderer.material = new Material(Shader.Find("Standard"));
        renderer.material.color = color;
        return obj;
    }

    private void CreateText(Transform parent, string value, Vector3 localPosition, float size, Color color, TextAnchor anchor)
    {
        var obj = new GameObject("Text: " + value);
        obj.transform.SetParent(parent, false);
        obj.transform.localPosition = localPosition;
        var text = obj.AddComponent<TextMesh>();
        text.text = value;
        text.fontSize = 48;
        text.characterSize = size / 2f;
        text.anchor = anchor;
        text.alignment = TextAlignment.Center;
        text.color = color;
    }

    private void TryPressButton()
    {
        if (!rightHand.TryGetFeatureValue(CommonUsages.devicePosition, out Vector3 origin) ||
            !rightHand.TryGetFeatureValue(CommonUsages.deviceRotation, out Quaternion rotation)) return;

        if (Physics.Raycast(origin, rotation * Vector3.forward, out RaycastHit hit, 4f))
        {
            var button = hit.collider.GetComponent<PoopbotTrollButton>();
            if (button != null) button.Press();
        }
    }

    internal void OnTrollButton(string label)
    {
        PlayTone(520f + (label.Length * 23f), 0.16f);
        if (rightHand.isValid && Time.time >= nextHapticTime)
        {
            rightHand.SendHapticImpulse(0, 0.25f, 0.08f);
            nextHapticTime = Time.time + 0.2f;
        }
        Debug.Log("[POOPBOT] " + label + " — fake button pressed. Nothing in Gorilla Tag was changed.");
    }

    private void PlayTone(float frequency, float duration)
    {
        int sampleRate = 44100;
        int count = Mathf.CeilToInt(sampleRate * duration);
        var samples = new float[count];
        for (int i = 0; i < count; i++)
        {
            float envelope = 1f - (float)i / count;
            samples[i] = Mathf.Sin(2f * Mathf.PI * frequency * i / sampleRate) * envelope * 0.12f;
        }
        var clip = AudioClip.Create("POOPBOT beep", count, 1, sampleRate, false);
        clip.SetData(samples, 0);
        audioSource.PlayOneShot(clip);
        Destroy(clip, duration + 0.1f);
    }
}

public sealed class PoopbotTrollButton : MonoBehaviour
{
    private PoopbotQuestMenu owner;
    private string label;

    public void Initialize(PoopbotQuestMenu menu, string buttonLabel)
    {
        owner = menu;
        label = buttonLabel;
    }

    public void Press()
    {
        if (owner != null) owner.OnTrollButton(label);
    }
}
