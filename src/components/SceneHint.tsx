interface SceneHintProps {
  text: string
}

export default function SceneHint({ text }: SceneHintProps) {
  return <div className="scene-hint">{text}</div>
}
