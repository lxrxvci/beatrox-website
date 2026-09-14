import type { ReactNode } from 'react'
import Link from 'next/link'

export interface TermsSection {
  heading: string | null
  paragraphs: ReactNode[]
}

export const termsSections: TermsSection[] = [
  {
    heading: null,
    paragraphs: [
      <>
        These Website Terms of Service and Terms and Conditions (“Terms”) govern your access to and use of websites, online platforms, forms, booking systems, rental systems, and other online services operated by Beatrox LLC (“Beatrox,” “we,” “us,” or “our”), including <strong>beatrox.com</strong>, <strong>rentals.beatrox.com</strong>, and any Beatrox-owned website or subdomain that links to these Terms (collectively, the “Site”).
      </>,
      <>
        Please read these Terms carefully.
      </>,
      <>
        By accessing or using the Site, submitting an inquiry, booking a consultation, creating an account, requesting a quote, initiating a rental, or otherwise using an interactive feature of the Site, you agree to these Terms.
      </>,
      <>
        If you do not agree to these Terms, do not use the Site.
      </>,
    ],
  },
  {
    heading: "1. About Beatrox",
    paragraphs: [
      <>
        Beatrox LLC is an experiential design, technical production, fabrication, creative technology, and event production company based in Portland, Oregon.
      </>,
      <>
        Beatrox provides services that may include experiential design, event production, production management, technical direction, AV equipment rental and sourcing, LED video systems, audio, lighting, projection mapping, laser systems, drone shows, custom fabrication, scenic construction, staging, rigging coordination, interactive technology, software development, engineering and technical documentation, system integration, staffing, logistics, permitting support, consultation, and related professional services.
      </>,
      <>
        Descriptions of these capabilities on the Site are informational and do not constitute a commitment to provide any particular service.
      </>,
    ],
  },
  {
    heading: "2. Website Use Is Not a Project Agreement",
    paragraphs: [
      <>
        Use of the Site, submission of a contact form, request for a quote, consultation, telephone conversation, email exchange, rental inquiry, or other communication with Beatrox does <strong>not by itself create a binding agreement requiring Beatrox to provide services or reserve equipment, personnel, dates, or production capacity</strong>.
      </>,
      <>
        A project, production, rental, fabrication order, installation, or other engagement becomes binding only when the requirements specified by Beatrox for that engagement have been satisfied.
      </>,
      <>
        Depending on the project, those requirements may include execution of a proposal, statement of work, rental agreement, master services agreement, production agreement, purchase order, or other written agreement; payment of a deposit or other required amount; delivery of insurance documents; completion of identity or credit verification; and written confirmation by Beatrox.
      </>,
      <>
        Availability shown or discussed before confirmation is subject to change.
      </>,
    ],
  },
  {
    heading: "3. Order of Precedence",
    paragraphs: [
      <>
        These Terms establish general conditions governing use of the Site.
      </>,
      <>
        Specific transactions may be governed by additional agreements, including proposals, statements of work, estimates, rental agreements, production agreements, fabrication agreements, purchase orders, equipment schedules, change orders, vendor agreements, event rules, or other written terms.
      </>,
      <>
        If there is a conflict between these Terms and a written agreement specifically governing a project or transaction, the transaction-specific written agreement controls with respect to that project or transaction.
      </>,
      <>
        Nothing in these Terms changes payment terms, intellectual property rights, cancellation provisions, warranties, insurance requirements, or other conditions expressly established in a separately executed agreement.
      </>,
    ],
  },
  {
    heading: "4. Eligibility and Authority",
    paragraphs: [
      <>
        You must be at least 18 years old to enter into a transaction through the Site.
      </>,
      <>
        If you use the Site on behalf of a company, agency, venue, promoter, organization, or other entity, you represent that you have authority to act on behalf of that entity with respect to the information or requests you submit.
      </>,
      <>
        You may not enter into a purported agreement on behalf of another party without authorization.
      </>,
    ],
  },
  {
    heading: "5. Project Inquiries and Consultations",
    paragraphs: [
      <>
        The Site allows prospective clients to provide information concerning potential events and projects, including project type, requested services, location, dates, budgets, technical requirements, creative concepts, and other project information.
      </>,
      <>
        Information submitted to Beatrox is used to evaluate the project, determine feasibility, assess availability, develop pricing, recommend approaches, and determine whether Beatrox is an appropriate partner.
      </>,
      <>
        A consultation may include preliminary technical recommendations, feasibility observations, budget guidance, scheduling guidance, or creative discussion.
      </>,
      <>
        Unless specifically identified as a contracted deliverable, information provided during an introductory or discovery consultation is preliminary and should not be treated as final engineering, construction documentation, safety documentation, production documentation, or a guaranteed project price.
      </>,
    ],
  },
  {
    heading: "6. Confidential Project Information",
    paragraphs: [
      <>
        Beatrox regularly receives non-public creative, technical, financial, operational, and business information during project inquiries and consultations.
      </>,
      <>
        For project inquiries submitted through an authorized Beatrox consultation or project-request process, Beatrox and the submitting party agree to treat information that is identified as confidential, or that a reasonable person would understand to be confidential given its nature and circumstances, as “Confidential Information.”
      </>,
      <>
        Each party agrees to use the other party's Confidential Information primarily for evaluating, planning, negotiating, or performing the potential business relationship and to use reasonable care to protect it from unauthorized disclosure.
      </>,
      <>
        Confidential Information may be shared with employees, contractors, professional advisors, technical partners, vendors, or subcontractors who reasonably need the information for the project and who are subject to confidentiality obligations or professional duties of confidentiality.
      </>,
      <>
        Confidential Information does not include information that was lawfully known without restriction before disclosure, becomes publicly available without breach of an obligation, is independently developed without use of the Confidential Information, or is lawfully received from another source without a confidentiality restriction.
      </>,
      <>
        A party may disclose Confidential Information when required by law, subpoena, court order, or governmental authority.
      </>,
      <>
        Any separately executed nondisclosure or confidentiality agreement supersedes this Section to the extent the agreements conflict.
      </>,
      <>
        This Section is intended to provide baseline confidentiality for legitimate project inquiries and consultations. The Site should not be used as a secure repository for trade secrets, export-controlled information, highly sensitive security information, passwords, payment credentials, or other information requiring specialized security controls unless Beatrox expressly requests it.
      </>,
    ],
  },
  {
    heading: "7. Unsolicited Ideas",
    paragraphs: [
      <>
        Beatrox works continuously on creative, experiential, technical, software, fabrication, and production concepts.
      </>,
      <>
        Ideas submitted outside an established project inquiry or consultation may be similar to concepts independently developed by Beatrox or its clients.
      </>,
      <>
        Accordingly, you should not send unsolicited concepts that you expect Beatrox to treat as exclusively yours unless there is an established project relationship or written confidentiality agreement.
      </>,
      <>
        Beatrox does not claim ownership merely because an idea or project concept is submitted through the Site.
      </>,
    ],
  },
  {
    heading: "8. Submitted Materials",
    paragraphs: [
      <>
        You may provide Beatrox with drawings, CAD files, images, video, music, logos, specifications, plans, reference material, technical information, brand assets, software, or other content (“Submitted Materials”).
      </>,
      <>
        You retain whatever ownership rights you otherwise hold in your Submitted Materials.
      </>,
      <>
        By providing Submitted Materials to Beatrox, you authorize Beatrox to access, reproduce, transmit, convert, review, modify, or otherwise use those materials as reasonably necessary to evaluate your request, prepare a proposal, perform an authorized project, or provide requested services.
      </>,
      <>
        You represent that you have the rights and permissions necessary to provide those materials to Beatrox for the intended purpose.
      </>,
      <>
        You may not knowingly submit material that infringes intellectual property rights, violates confidentiality obligations, contains malicious software, or is otherwise unlawful.
      </>,
    ],
  },
  {
    heading: "9. Quotes, Estimates, Budgets, and Availability",
    paragraphs: [
      <>
        Unless expressly identified as binding, pricing shown on the Site or discussed during preliminary communications is an estimate or general informational reference.
      </>,
      <>
        Actual pricing may depend on equipment availability, labor requirements, engineering, fabrication requirements, material pricing, transportation, travel, venue requirements, union labor, insurance requirements, permitting, project schedules, overtime, technical specifications, third-party vendors, and other project-specific factors.
      </>,
      <>
        A formal proposal or quote may have an expiration date and may be subject to equipment, labor, and vendor availability.
      </>,
      <>
        Equipment, dates, personnel, inventory, or production capacity are not considered reserved solely because they appear available online or are discussed with Beatrox.
      </>,
    ],
  },
  {
    heading: "10. Deposits and Payments",
    paragraphs: [
      <>
        Payment schedules are established in the applicable quote, proposal, rental agreement, statement of work, invoice, or other transaction-specific agreement.
      </>,
      <>
        Certain projects require a deposit, advance payment, progress payments, or payment in full before equipment, labor, fabrication capacity, vendors, or production dates are committed.
      </>,
      <>
        Unless Beatrox expressly agrees otherwise in writing, Beatrox is not required to advance third-party vendor expenses, equipment sub-rental costs, travel expenses, permits, fabrication materials, venue charges, or similar pass-through costs on behalf of a client.
      </>,
      <>
        Failure to make required payments may result in suspension of work, withholding of equipment or deliverables, cancellation of reservations, or schedule changes to the extent permitted by the applicable agreement and law.
      </>,
    ],
  },
  {
    heading: "11. Changes in Scope",
    paragraphs: [
      <>
        Live-event, fabrication, installation, software, and experiential projects frequently evolve after the initial scope is established.
      </>,
      <>
        Requests that materially change design requirements, quantities, dimensions, equipment, creative direction, technical specifications, schedules, labor requirements, venue conditions, content requirements, fabrication, programming, logistics, or deliverables may require revised pricing or a change order.
      </>,
      <>
        Website communications or informal discussions do not automatically amend an executed scope of work.
      </>,
      <>
        Changes become part of the contracted scope only when approved through the process established for the applicable engagement.
      </>,
    ],
  },
  {
    heading: "12. Equipment Rentals",
    paragraphs: [
      <>
        Equipment rentals placed or initiated through Beatrox are subject to the applicable Beatrox Rental Agreement and transaction-specific terms.
      </>,
      <>
        Depending on the rental, Beatrox may require identification verification, payment authorization, security deposits, insurance, certificates of insurance, proof of coverage for rented equipment, additional-insured status, or other risk-management documentation.
      </>,
      <>
        The renter may be responsible for loss, theft, damage, misuse, missing components, late return, unauthorized relocation, or other costs as specified in the applicable Rental Agreement.
      </>,
      <>
        Equipment availability is not guaranteed until the rental is confirmed.
      </>,
      <>
        Equipment photographs, inventory descriptions, technical specifications, and availability information are provided to assist with equipment selection. Equivalent equipment or substitutions may be proposed when reasonably necessary and permitted by the applicable rental agreement.
      </>,
    ],
  },
  {
    heading: "13. Dry Hire and Operated Rentals",
    paragraphs: [
      <>
        Equipment rental does not automatically include delivery, installation, programming, operation, technical labor, strike, trucking, engineering, or production management unless those items are expressly included in the applicable quote or agreement.
      </>,
      <>
        Where Beatrox supplies technical personnel, labor charges, minimum calls, overtime, travel, meal penalties, venue delays, union requirements, and additional labor may apply as described in the applicable proposal or agreement.
      </>,
    ],
  },
  {
    heading: "14. Third-Party Equipment, Vendors, and Subcontractors",
    paragraphs: [
      <>
        Beatrox may obtain equipment, labor, engineering, transportation, specialty services, fabrication, entertainment, technology, or other project resources from third parties.
      </>,
      <>
        Beatrox may also coordinate directly with vendors retained by the client, venue, promoter, agency, or another party.
      </>,
      <>
        Third-party availability, pricing, policies, performance, transportation, and lead times may affect the project.
      </>,
      <>
        Where third-party expenses are passed through Beatrox, administrative or management markups may apply when disclosed in the applicable proposal or agreement.
      </>,
      <>
        The responsibility for a particular vendor, contractor, or expense will be determined by the applicable project agreement.
      </>,
    ],
  },
  {
    heading: "15. Vendor Portal",
    paragraphs: [
      <>
        If Beatrox provides a vendor, partner, or equipment-owner portal, participation in that program may require a separate vendor agreement.
      </>,
      <>
        Listing equipment or information through a Beatrox platform does not by itself create an employment relationship, partnership, joint venture, franchise, or agency relationship between Beatrox and a vendor.
      </>,
      <>
        Vendor compensation, responsibilities, insurance, equipment ownership, availability, maintenance, fulfillment, damage responsibility, and other commercial matters are governed by the applicable vendor agreement.
      </>,
    ],
  },
  {
    heading: "16. Client Responsibilities",
    paragraphs: [
      <>
        Successful production depends on timely and accurate information from clients, venues, vendors, and other stakeholders.
      </>,
      <>
        Clients may be responsible under project-specific agreements for providing accurate dimensions, drawings, technical specifications, content, logos and brand assets, event schedules, venue contacts, power information, rigging information, access information, site conditions, artist requirements, and other materials necessary for execution.
      </>,
      <>
        Delays, errors, omissions, or changes in client-supplied or third-party information may result in schedule changes or additional costs.
      </>,
      <>
        Clients are also responsible for obtaining rights to any copyrighted music, video, photography, trademarks, logos, artwork, software, or other materials they instruct Beatrox to incorporate into a project unless Beatrox has expressly agreed to obtain those rights.
      </>,
    ],
  },
  {
    heading: "17. Permits, Inspections, and Regulatory Approvals",
    paragraphs: [
      <>
        Certain Beatrox services may involve permits, variances, inspections, engineering approvals, venue approvals, flight authorizations, fire and life-safety requirements, or other governmental or regulatory processes.
      </>,
      <>
        Beatrox may prepare, coordinate, or submit permit and approval documentation when included within the applicable scope.
      </>,
      <>
        Government agencies, authorities having jurisdiction, venues, property owners, engineers, inspectors, and other third parties retain control over their respective approval processes.
      </>,
      <>
        Accordingly, Beatrox cannot guarantee that a particular permit, variance, inspection, authorization, or venue approval will be issued by a particular date or issued at all unless such guarantee is expressly made in a written agreement.
      </>,
    ],
  },
  {
    heading: "18. Site Conditions and Safety",
    paragraphs: [
      <>
        Information concerning venues, structures, rigging points, electrical systems, weather exposure, audience areas, installation surfaces, access, load limits, floor conditions, utilities, or other site conditions may materially affect the feasibility and safety of a production.
      </>,
      <>
        Beatrox may modify, suspend, or decline work where conditions are unsafe, materially different from information previously provided, prohibited by an authority having jurisdiction, or inconsistent with applicable safety requirements.
      </>,
      <>
        Project-specific responsibilities concerning site safety, security, crowd control, rigging, structural engineering, electrical services, weather monitoring, and related matters are determined by the applicable agreement and venue requirements.
      </>,
    ],
  },
  {
    heading: "19. Technical Information Is Not General Professional Advice",
    paragraphs: [
      <>
        The Site contains information regarding event production, equipment, lighting, audio, video, rigging, lasers, drones, fabrication, electrical systems, software, engineering, permitting, and other technical subjects.
      </>,
      <>
        This content is provided for general informational and marketing purposes.
      </>,
      <>
        It is not a substitute for project-specific engineering, structural review, electrical design, rigging analysis, laser safety analysis, aviation review, code review, professional consultation, venue approval, or governmental approval.
      </>,
      <>
        Technical decisions involving safety should be made using project-specific information and appropriately qualified personnel.
      </>,
    ],
  },
  {
    heading: "20. Renderings, Visualizations, and Pre-Visualization",
    paragraphs: [
      <>
        Concept drawings, renderings, simulations, animations, photographs, videos, mockups, diagrams, pre-visualizations, and other representations may be used to communicate a proposed design or experience.
      </>,
      <>
        Unless expressly identified as a final construction or engineering document, these materials are illustrative and may not reflect final dimensions, structural details, materials, equipment models, lighting conditions, fabrication methods, site conditions, or finished appearance.
      </>,
      <>
        Final production is governed by approved project documentation and the applicable agreement.
      </>,
    ],
  },
  {
    heading: "21. Intellectual Property — Beatrox Website",
    paragraphs: [
      <>
        The Site and its contents, including its design, text, graphics, photography, video, animation, case studies, drawings, diagrams, software, source code, interfaces, logos, trademarks, trade dress, audio, and other materials (“Site Content”), are owned by Beatrox or used with permission from their respective owners.
      </>,
      <>
        Site Content is protected by copyright, trademark, trade secret, and other intellectual property laws.
      </>,
      <>
        Beatrox grants you a limited, revocable, non-exclusive, non-transferable right to access the Site for legitimate informational and business purposes.
      </>,
      <>
        Except as permitted by applicable law or authorized in writing by Beatrox, you may not reproduce, publish, modify, distribute, sell, commercially exploit, reverse engineer, scrape, systematically download, republish, or create derivative works from Site Content.
      </>,
    ],
  },
  {
    heading: "22. Artificial Intelligence, Data Mining, and Automated Use",
    paragraphs: [
      <>
        You may not use automated systems to scrape, extract, replicate, index, harvest, or systematically collect Site Content in a manner that exceeds ordinary search-engine indexing or normal human use of the Site without written authorization from Beatrox.
      </>,
      <>
        You may not use Beatrox's proprietary designs, project imagery, drawings, written content, code, renderings, case studies, or other protected Site Content to train, fine-tune, build, or materially improve an artificial intelligence or machine-learning model without authorization from Beatrox or the applicable rights holder.
      </>,
      <>
        This Section does not restrict activities that cannot legally be restricted under applicable law.
      </>,
    ],
  },
  {
    heading: "23. Intellectual Property — Proposals and Project Materials",
    paragraphs: [
      <>
        Beatrox may develop concepts, budgets, proposals, drawings, system designs, technical solutions, software architectures, fabrication methods, renderings, specifications, workflows, code, documentation, or other materials when developing or performing a project.
      </>,
      <>
        Ownership and licensing of final project deliverables are governed by the applicable project agreement.
      </>,
      <>
        Unless otherwise agreed in writing, submission of a proposal or concept does not transfer ownership of Beatrox intellectual property to the recipient.
      </>,
      <>
        Before authorization or payment as required by the applicable agreement, Beatrox proposals, designs, drawings, renderings, specifications, and technical concepts may not be reproduced, commercially exploited, constructed from, or distributed for competitive bidding or execution by another provider without Beatrox's authorization.
      </>,
      <>
        Beatrox retains ownership of its pre-existing tools, methods, software components, code libraries, templates, production techniques, workflows, know-how, processes, and other background intellectual property unless expressly transferred in writing.
      </>,
    ],
  },
  {
    heading: "24. Portfolio and Case Study Content",
    paragraphs: [
      <>
        The Site may contain photographs, video, descriptions, credits, logos, project information, or other material documenting prior projects.
      </>,
      <>
        Third-party trademarks and brand names remain the property of their respective owners.
      </>,
      <>
        References to a client, brand, venue, partner, manufacturer, or project do not imply sponsorship, endorsement, or an ongoing relationship unless expressly stated.
      </>,
      <>
        Project credits may reflect Beatrox's role within a larger collaborative production and should not be interpreted as a claim that Beatrox independently performed every aspect of the project.
      </>,
    ],
  },
  {
    heading: "25. Feedback",
    paragraphs: [
      <>
        If you voluntarily provide feedback about the Site, Beatrox's customer experience, or Beatrox's general services, Beatrox may use that feedback to improve its operations without compensation or restriction.
      </>,
      <>
        This provision does not apply to Confidential Information, client-owned project materials, or proprietary project concepts submitted through an established project inquiry.
      </>,
    ],
  },
  {
    heading: "26. Electronic Communications and Signatures",
    paragraphs: [
      <>
        By conducting transactions electronically, you consent to receive transaction-related documents, contracts, invoices, confirmations, notices, and records electronically.
      </>,
      <>
        Where an electronic signature system is provided, electronic signatures may be used to execute transaction documents to the extent permitted by applicable law.
      </>,
      <>
        Consent to electronic transaction communications does not constitute consent to receive unrelated marketing communications.
      </>,
    ],
  },
  {
    heading: "27. Third-Party Platforms and Links",
    paragraphs: [
      <>
        The Site may integrate with or link to third-party services such as payment processors, ticketing platforms, maps, video platforms, scheduling systems, identity-verification services, social networks, manufacturers, vendors, cloud platforms, or other services.
      </>,
      <>
        Third-party services are governed by their own terms and privacy policies.
      </>,
      <>
        Beatrox does not control third-party websites or services and is not responsible for their availability, security, content, policies, or independent conduct.
      </>,
    ],
  },
  {
    heading: "28. Event Ticketing",
    paragraphs: [
      <>
        When Beatrox sells or facilitates event tickets, the transaction may also be subject to event-specific terms, venue policies, ticketing-platform rules, age restrictions, refund policies, fees, taxes, and other conditions communicated at the time of purchase.
      </>,
      <>
        Third-party ticketing providers may independently charge processing, service, payment, or other fees.
      </>,
      <>
        If event-specific ticketing terms conflict with these Website Terms with respect to an event ticket, the event-specific terms control.
      </>,
    ],
  },
  {
    heading: "29. Cancellations and Postponements",
    paragraphs: [
      <>
        Cancellation, postponement, rescheduling, weather, force majeure, deposits, credits, refunds, and termination rights for a project, rental, fabrication order, or event are governed by the agreement applicable to that transaction.
      </>,
      <>
        Nothing on the Site creates a general right to cancel a confirmed production or receive a refund.
      </>,
      <>
        Users should review the applicable proposal, rental agreement, ticketing terms, event rules, or other transaction documents before committing to a purchase or booking.
      </>,
    ],
  },
  {
    heading: "30. Force Majeure and Events Beyond Reasonable Control",
    paragraphs: [
      <>
        Live productions and experiential projects may be affected by circumstances outside the reasonable control of Beatrox, including severe weather, natural disasters, governmental actions, emergencies, transportation disruptions, labor disputes, utility failures, telecommunications failures, venue closures, public-health emergencies, supplier failures, equipment transportation delays, or other extraordinary events.
      </>,
      <>
        Rights and responsibilities concerning these events for contracted projects are governed by the applicable agreement.
      </>,
    ],
  },
  {
    heading: "31. Prohibited Use",
    paragraphs: [
      <>
        You may not use the Site to engage in unlawful, fraudulent, abusive, deceptive, infringing, or malicious activity.
      </>,
      <>
        You may not attempt to interfere with the Site's operation, bypass security controls, access accounts or systems without authorization, introduce malicious code, conduct unauthorized vulnerability testing, impersonate another person or organization, manipulate rental availability or pricing, initiate fraudulent transactions, or use the Site in a manner that materially interferes with other users or Beatrox operations.
      </>,
    ],
  },
  {
    heading: "32. Account Security",
    paragraphs: [
      <>
        If the Site allows you to create an account, you are responsible for maintaining the confidentiality of your credentials and for activity conducted through your account.
      </>,
      <>
        You must provide accurate account information and promptly notify Beatrox if you believe an account has been compromised.
      </>,
      <>
        Beatrox may suspend or restrict an account when reasonably necessary to prevent fraud, unauthorized access, nonpayment, abuse, security threats, or violations of these Terms.
      </>,
    ],
  },
  {
    heading: "33. Website Availability and Accuracy",
    paragraphs: [
      <>
        Beatrox works to maintain accurate and useful information but does not guarantee that the Site will always be uninterrupted, error-free, current, or complete.
      </>,
      <>
        Inventory, product specifications, photographs, pricing, availability, service descriptions, personnel, project information, and other Site Content may change.
      </>,
      <>
        Beatrox may modify, remove, suspend, or discontinue portions of the Site at any time.
      </>,
    ],
  },
  {
    heading: "34. Disclaimer of Warranties",
    paragraphs: [
      <>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SITE AND SITE CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE.”
      </>,
      <>
        BEATROX DISCLAIMS WARRANTIES REGARDING THE OPERATION, AVAILABILITY, ACCURACY, RELIABILITY, SECURITY, OR FITNESS OF THE SITE FOR A PARTICULAR PURPOSE TO THE EXTENT SUCH WARRANTIES MAY LAWFULLY BE DISCLAIMED.
      </>,
      <>
        THIS DISCLAIMER RELATES TO THE WEBSITE AND DOES NOT REPLACE WARRANTIES OR SERVICE OBLIGATIONS EXPRESSLY PROVIDED IN A PROJECT-SPECIFIC WRITTEN AGREEMENT.
      </>,
    ],
  },
  {
    heading: "35. Limitation of Liability for Website Use",
    paragraphs: [
      <>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEATROX WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING SOLELY FROM USE OF OR INABILITY TO USE THE SITE, INCLUDING LOST PROFITS, LOST DATA, OR LOST BUSINESS OPPORTUNITIES.
      </>,
      <>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEATROX'S AGGREGATE LIABILITY ARISING SOLELY FROM USE OF THE SITE WILL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100).
      </>,
      <>
        THIS SECTION DOES NOT LIMIT LIABILITY ARISING FROM CONTRACTED PROJECT SERVICES WHERE A SEPARATE WRITTEN AGREEMENT ESTABLISHES DIFFERENT LIABILITY TERMS, AND IT DOES NOT EXCLUDE LIABILITY THAT CANNOT LAWFULLY BE EXCLUDED.
      </>,
    ],
  },
  {
    heading: "36. Indemnification",
    paragraphs: [
      <>
        To the extent permitted by law, you agree to indemnify and hold harmless Beatrox and its officers, employees, contractors, and representatives from third-party claims arising from your unlawful misuse of the Site, fraudulent activity, violation of these Terms, infringement caused by materials you knowingly submit without authorization, or violation of another person's rights.
      </>,
      <>
        This Section does not replace indemnification provisions contained in a project-specific agreement.
      </>,
    ],
  },
  {
    heading: "37. Suspension and Termination",
    paragraphs: [
      <>
        Beatrox may suspend or terminate access to all or part of the Site when reasonably necessary because of suspected fraud, unlawful activity, cybersecurity risk, nonpayment associated with an online account, material violation of these Terms, or conduct that threatens Beatrox, its systems, its clients, its vendors, or other users.
      </>,
      <>
        Termination of Site access does not automatically terminate an existing project agreement unless the applicable agreement provides otherwise.
      </>,
    ],
  },
  {
    heading: "38. Privacy",
    paragraphs: [
      <>
        Use of personal information collected through the Site is governed by the <Link href="/privacy"><strong>Beatrox LLC Privacy Policy</strong></Link>, which is incorporated into these Terms by reference.
      </>,
    ],
  },
  {
    heading: "39. Governing Law",
    paragraphs: [
      <>
        These Terms are governed by the laws of the State of Oregon, without regard to conflict-of-law principles.
      </>,
      <>
        Except where applicable law requires otherwise or a separate agreement establishes another dispute-resolution procedure, disputes arising solely from these Terms or use of the Site shall be brought in the appropriate state or federal courts located in Multnomah County, Oregon.
      </>,
      <>
        Each party consents to the jurisdiction of those courts for such disputes.
      </>,
    ],
  },
  {
    heading: "40. Severability",
    paragraphs: [
      <>
        If any provision of these Terms is determined to be invalid, illegal, or unenforceable, the remaining provisions will remain in effect to the fullest extent permitted by law.
      </>,
      <>
        The invalid provision will be interpreted or modified to the minimum extent necessary to make it enforceable where permitted.
      </>,
    ],
  },
  {
    heading: "41. No Waiver",
    paragraphs: [
      <>
        Failure by Beatrox to enforce a provision of these Terms does not constitute a waiver of that provision or any other right.
      </>,
    ],
  },
  {
    heading: "42. Assignment",
    paragraphs: [
      <>
        You may not assign your rights or obligations arising from an online transaction governed by these Terms without Beatrox's written consent when the assignment would materially affect Beatrox's obligations or risk.
      </>,
      <>
        Beatrox may assign these Terms in connection with a merger, acquisition, reorganization, financing, sale of substantially all relevant assets, or similar business transaction.
      </>,
    ],
  },
  {
    heading: "43. No Partnership or Agency",
    paragraphs: [
      <>
        Use of the Site, submission of an inquiry, participation in a consultation, vendor interaction, or other communication with Beatrox does not by itself create a partnership, joint venture, employment, fiduciary, franchise, or agency relationship.
      </>,
      <>
        Any such relationship must be expressly established by a separate written agreement.
      </>,
    ],
  },
  {
    heading: "44. Changes to These Terms",
    paragraphs: [
      <>
        Beatrox may update these Terms to reflect changes in the Site, services, business practices, or applicable law.
      </>,
      <>
        Revised Terms will be posted with an updated “Last Updated” date.
      </>,
      <>
        Changes apply prospectively unless otherwise required by law.
      </>,
      <>
        Material contractual rights under an existing executed agreement will not be retroactively changed merely by posting revised Website Terms.
      </>,
    ],
  },
  {
    heading: "45. Entire Agreement Regarding Website Use",
    paragraphs: [
      <>
        These Terms, together with the Privacy Policy and any additional Site-specific terms expressly incorporated by reference, constitute the agreement between you and Beatrox concerning general use of the Site.
      </>,
      <>
        They do not replace an executed proposal, statement of work, master services agreement, rental agreement, production agreement, vendor agreement, NDA, purchase order, or other contract governing a specific transaction.
      </>,
    ],
  },
  {
    heading: "46. Contact",
    paragraphs: [
      <>
        Questions regarding these Terms may be directed to:
      </>,
      <>
        <strong>Beatrox LLC</strong><br />
1313 SE 3rd Ave<br />
Portland, Oregon 97214<br />
United States
      </>,
      <>
        <strong>Email:</strong> admin@beatrox.com<br />
<strong>Website:</strong> beatrox.com
      </>,
    ],
  },
]
