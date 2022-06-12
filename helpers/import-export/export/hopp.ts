import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { HoppExporter } from "."
import { HoppRESTRequest, HoppCollection } from "~/data"

const exporter: HoppExporter<HoppCollection<HoppRESTRequest>> = (content) =>
  pipe(content, JSON.stringify, TE.right)

export default exporter
