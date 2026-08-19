# Local Research Agent Document Report

**Date:** 2026-08-19T01:11:59.323Z

## Selected Documents

1. **03SpectrumSensingFM0** - Indexed local PDF: 03SpectrumSensingFM0.pdf
   - File: 03SpectrumSensingFM0.pdf
   - SHA-256: `3e283c6d13cf610d4276a7e64711ba4441938807abb99de3f772e2cc049cb1b2`
   - Size: 488294 bytes
   - Type: PDF

## Answers & LLM Inferences

### User

what abut FM

### Agent

I did not find indexed local documents matching "what abut FM". Run a scan, then try a filename, acronym, topic, standard number, or report title from the local docs folder.

### User

spectrumSensingFM

### Agent

I found 1 local document related to "spectrumSensingFM".
This first prototype uses local document metadata and filenames. Enable Ollama plus text extraction/embeddings for deeper inference over PDF contents.

1. 03SpectrumSensingFM0 (03SpectrumSensingFM0.pdf, 488294 bytes, sha256 3e283c6d13cf610d4276a7e64711ba4441938807abb99de3f772e2cc049cb1b2, type pdf)

### User

[Deep] what about the ITU-R BS.412 on this doc

### Agent

[Deep Analysis of 03SpectrumSensingFM0]

Heuristic Analysis: The document mentions "what about the ITU-R BS.412 on this doc" in several sections. Key findings related to this query include: SDR-Based Spectrum Monitoring System for FM Broadcast
Compliance Assessment
Introduction
– Purpose and Scope.  This document specifies the architecture, measurement framework, and pro-
cessing algorithms for a Software-Defined Radio (SDR) based FM broadcast compliance mon-
itoring system.  It is intended for:
  RF engineers designing and deploying sensor nodes;
  Regulatory bodies evaluating technical adequacy and metrological traceability;
  Software developers implementing DSP processing pipelines;
  System operators responsible for calibration, validation, and evidence archiving.
This  document  is  primarily  a  framework  and  requirements  specification.   The  framework
addresses  the  complete  monitoring  chain  with  explicit  treatment  of  calibration  hierarchy,
uncertainty propagation, node health, multi-node coordination, and audit-ready reporting.
– Regulatory Context.  The  system  targets  compliance  assessment  under  the  following  regulatory
and technical frameworks:
 FCC Part 73 (United States):  Technical standards for FM broadcast service, including
carrier frequency tolerance, occupied bandwidth, and emission mask requirements;
 ANE Resolucin 105 (applicable jurisdiction):  National regulatory provisions governing
FM broadcast technical parameters;
 ITU-R BS.412:  International technical standards for FM sound broadcasting;
 ISO/IEC 17025:   General  requirements  for  the  competence  of  testing  and  calibration
laboratories, applicable to measurement traceability and uncertainty evaluation.
For each deployment, the applicable regulatory basis shall be explicitly identified in the sys-
tem configuration, measurement procedure, and reporting policy.  All reported measurands,
decision outcomes, and compliance determinations shall be traceable to the governing rule set,
the calibration state of the measurement chain, and the documented processing and decision
procedure used to produce the result.
1
1
Throughout  this  document,  the  key  words  “shall”,  “shall  not”,  “should”,  “should  not”,  and  “may”  are  to  be
interpreted as described in RFC 2119 [?].  Requirements denoted by “shall” are mandatory for compliance with this
specification.
1; –  Tier 1:  Primary (Laboratory) Calibration.  Each monitoring node shall undergo initial end-to-
end calibration in a controlled laboratory environment, traceable to national or international
standards.   This  calibration  shall  establish  the  absolute  accuracy  of  the  measurement  ref-
erence  plane,  typically  the  antenna  port,  and  shall  characterize  frequency  response,  power
accuracy, linearity, and relevant environmental sensitivities.  A unique calibration certificate
and electronic calibration record shall be maintained for each node.
–  Tier 2:  Secondary (Field) Verification. Each node shall undergo periodic in situ verification to
confirm that performance remains within acceptable limits relative to the primary calibration
state.  This procedure may use an internal reference source or a stable external signal.  It need
not  re-establish  absolute  traceability,  but  shall  provide  a  reliable  check  against  predefined
warning and alarm limits.  Failure shall trigger a maintenance alert and suspend compliance
use until resolved.
–  Tier  3:   Relative  (Channel)  Calibration.   For  measurements  that  do  not  require  absolute
power accuracy, a relative calibration across the observation bandwidth shall be maintained
to  control  gain  and  phase  distortion  in  spectral  measurements.   This  calibration  may  be
implemented through equalization filters, pilot-based methods, or passband characterization
established during primary calibration.
2. Functional Decomposition of the Monitoring System
The architecture resulting from these design considerations is summarized in Figure 1, which iden-
tifies the principal hardware and software components and their interconnections.
– RF Front-End (Hardware Layer):  The monitoring node employs a SDR receiver as the antenna-
coupled  RF  front  end  for  operation  in  the  VHF-II  broadcast  band  (87.5–108  MHz).   This
stage captures incident RF energy, tunes the band of interest, and produces digitized complex
baseband samples for downstream processing.  A VHF-II antenna interfaces to the SDR input,
and an LNA may be added when required to compensate for feedline loss or weak received
signals.  The suitability of this front end is governed by instantaneous bandwidth, dynamic
range, frequency-reference accuracy and stability, noise figure, and gain configuration, since
these parameters bound the fidelity of derived compliance measurands.
– Signal Acquisition and Digitization:  The SDR streams raw complex baseband (I/Q) samples to
the embedded host processor through a high-speed USB interface.  These samples represent
the instantaneous tuned observation bandwidth and permit simultaneous inspection of multi-
ple contiguous FM broadcast channels within a single acquisition window, reducing the need
for sequential retuning.  The selected sample rate shall be validated on the target platform to
ensure sustained operation without dropped samples, taking into account USB throughput,
host buffering, and processing load.
– Software Processing Engine:  The  software  processing  engine  implements  the  end-to-end  DSP
pipeline  for  FM  broadcast  compliance  monitoring.   Its  functions  may  include  spectrum  es-
timation, channelization, carrier detection, demodulation, occupancy assessment, feature ex-
traction,  alarm generation,  and compliance-metric evaluation.  The primary output of this
layer is not user-traffic recovery, but reported measurands, decision outcomes, and supporting
evidence suitable for regulatory review.
3; Baseline HackRF One Platform Assessment
Measurement Capability, Platform Limitations, and Suitability
The HackRF One was selected for large-scale deployment on the basis of cost and reconfigurability.
Its use as a primary sensor node entails a trade-off between cost-efficiency and metrological rigour
that must be explicitly characterised before any compliance determination is made.
Regulatory  standards  (e.g.,  FCC  Part  73,  ANE  Resolucin  105)  often  mandate  out-of-band
emission attenuation exceeding 80 dB, whereas the HackRF One’s 8-bit ADC offers a theoretical
dynamic range of only≈ 48 dB (6.02× 8 + 1.76 dB). In regulatory monitoring, the Effective Number
of Bits (ENOB) is more critical than nominal bit depth:  thermal noise, non-linearity, and input-
power-dependent  compression  typically  reduce  practical  resolution  to ≈ 7  bits  (≈ 42  dB),  with
further degradation at the band edges of the 20 MHz observation window.  This limitation renders
ACLR  measurements  and  any  measurand  dependent  on  high  dynamic  range  unreliable  without
external filtering and strict gain-staging.
To maintain metrological integrity, strict gain-staging protocols are required.  Peak signal levels
shall be maintained at least 6 dB below full scale to prevent clipping.  In distributed deployments
where the signal environment varies across nodes, this requires either manual gain profiling at each
site or verified AGC with mandatory state logging.  If AGC is employed, its state shall be recorded
and timestamped for every sample block; measurements acquired without this metadata shall not
be used for calibrated received power reporting and shall be flagged as invalid in the acquisition
record.
The  hardware’s  wideband  nature  introduces  three  DSP-level  pathologies  that  affect  different
parts of the compliance measurand set:
  DC spectral artifact.  The LO leakage produces a narrowband spike at DC in the baseband
spectrum. Offset tuning (setting f
LO
= f
target
+f
off
, f
off
= f
s
/4) displaces the spike away from
the measurement band and is the required mitigation.  This increases acquisition complexity:
precise mapping between the LO frequency, applied offset, and true RF frequency must be
maintained and recorded in metadata.
  I/Q imbalance.  Amplitude imbalance g and phase error φ between the I and Q channels
produce a mirror image of the desired signal at −f
offset
in the baseband spectrum.  The cor-
rection applied in the preprocessing stage (a 2×2 widely-linear matrix with scalar g and φ)
is  frequency-independent.   Across  the  20  MHz  observation  bandwidth,  the  HackRF  One’s
imbalance parameters are frequency-dependent; the scalar correction leaves a residual imbal-
ance at frequencies remote from the calibration tone.  Nodes operating with channel targets
more than approximately 5 MHz from the calibration tone frequency shall re-estimate g and
φ at a tone within 500 kHz of the target channel, or shall bound the residual mirror power
by  measurement  and  record  it  as  an  uncertainty  contributor.   The  corrected  mirror  power
shall remain below −40 dBc after correction;  results exceeding this threshold shall trigger
the IQ
RESIDUAL flag and shall not be used for occupied-bandwidth compliance estimation.
  Frequency-dependent noise floor.  The receive chain exhibits a non-flat noise and gain
profile across the observation bandwidth.  A relative (Tier 3) calibration is required to char-
acterise and correct this variation.  The detection margin ∆
det
used in Stage 4 channel detec-
tion is not a fixed absolute value; it shall be set as a site-calibrated offset above the locally
verified noise floor,  derived from the Tier 2 noise-floor verification required by the channel
13.

## Sources

1. 03SpectrumSensingFM0
