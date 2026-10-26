import { PageHeader } from "@/components/admin/AdminShell";
import { ContentForm } from "@/components/admin/ContentForm";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { getMedia } from "@/lib/media";
import { getSetting } from "@/lib/settings";

export default async function ContentPage() {
  await requireOwner();
  const { t } = await getDictionary();
  const home = getSetting("home");
  const about = getSetting("about");
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t.admin.content.title}
        actions={
          <a href="/" target="_blank" rel="noopener" className="abtn">
            {t.admin.nav.viewSite}
          </a>
        }
      />
      <ContentForm
        home={home}
        about={about}
        images={{ hero: getMedia(home.hero.imageId), about: getMedia(about.imageId) }}
      />
    </div>
  );
}
