import { account } from "./schema/auth/account";
import { role } from "./schema/auth/enums";
import { invitation } from "./schema/auth/invitation";
import { member } from "./schema/auth/member";
import {
  accountRelations,
  invitationRelations,
  memberRelations,
  sessionRelations,
  userRelations,
  venueRelations,
} from "./schema/auth/relations";
import { session } from "./schema/auth/session";
import { user } from "./schema/auth/user";
import { venue } from "./schema/auth/venue";
import { verification } from "./schema/auth/verification";
import { catalogItem } from "./schema/catalog-item";
import { claimToken } from "./schema/claim-token";
import { contentTranslation } from "./schema/content-translation";
import {
  menuStatus,
  translatedBy,
  translationEntityType,
  translationStatus,
  weekday,
} from "./schema/enum";
import { menu } from "./schema/menu";
import { menuCategory } from "./schema/menu-category";
import { menuEntry } from "./schema/menu-entry";
import { menuTab } from "./schema/menu-tab";
import { partner } from "./schema/partner";
import { partnerIdempotencyKey } from "./schema/partner-idempotency-key";
import { promotion } from "./schema/promotion";
import { promotionComponent } from "./schema/promotion-component";
import { promotionSchedule } from "./schema/promotion-schedule";
import { uploadedFile } from "./schema/uploaded-file";
import { venueLink } from "./schema/venue-link";
import { venueLocale } from "./schema/venue-locale";
import { webhookDelivery } from "./schema/webhook-delivery";

const schema = {
  role,
  menuStatus,
  weekday,
  translationEntityType,
  translationStatus,
  translatedBy,
  venue,
  user,
  session,
  account,
  verification,
  member,
  invitation,
  menu,
  menuTab,
  menuCategory,
  catalogItem,
  menuEntry,
  promotion,
  promotionComponent,
  promotionSchedule,
  venueLocale,
  contentTranslation,
  uploadedFile,
  partner,
  venueLink,
  claimToken,
  partnerIdempotencyKey,
  webhookDelivery,
  userRelations,
  sessionRelations,
  accountRelations,
  venueRelations,
  memberRelations,
  invitationRelations,
};

export default schema;
