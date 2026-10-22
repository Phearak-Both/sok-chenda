"use client";

import { saveContent } from "@/app/admin/actions/settings";
import { useI18n } from "@/i18n/client";
import type { AboutSettings, HomeSettings } from "@/lib/settings";
import type { Media } from "@/lib/types";
import { ActionForm, BilingualField, FormBanner, Section, SubmitButton } from "./fields";
import { ImageField } from "./images";

type Props = {
  home: HomeSettings;
  about: AboutSettings;
  images: { hero: Media | null; story: Media | null; about: Media | null };
};

export function ContentForm({ home, about, images }: Props) {
  const { t } = useI18n();
  const c = t.admin.content;
  return (
    <ActionForm action={saveContent} className="space-y-6 pb-20 lg:pb-0">
      {(state) => {
        const err = state.errors ?? {};
        return (
          <>
            <FormBanner state={state} />
            <Section title={c.hero}>
              <ImageField
                name="hero_image"
                label={c.heroImage}
                initial={images.hero}
                fallback="/brand/cover-960.webp"
                fallbackNote={c.defaultImage}
                aspect="aspect-[2/1]"
              />
              <BilingualField name="hero_eyebrow" label={c.eyebrow} defaultValue={home.hero.eyebrow} maxLength={80} />
              <BilingualField name="hero_title" label={c.headline} defaultValue={home.hero.title} error={err.hero_title} maxLength={160} />
              <BilingualField name="hero_subtitle" label={c.subtitle} defaultValue={home.hero.subtitle} multiline rows={2} maxLength={300} />
              <BilingualField name="hero_cta" label={c.button} defaultValue={home.hero.cta} error={err.hero_cta} maxLength={40} />
            </Section>

            <Section title={c.intro}>
              <BilingualField name="intro_title" label={c.sectionTitle} defaultValue={home.intro.title} error={err.intro_title} maxLength={160} />
              <BilingualField name="intro_body" label={c.sectionBody} defaultValue={home.intro.body} multiline rows={4} maxLength={1500} />
            </Section>

            <Section title={c.story}>
              <ImageField
                name="story_image"
                label={c.storyImage}
                initial={images.story}
                fallback="/brand/cover-960.webp"
                fallbackNote={c.defaultImage}
              />
              <BilingualField name="story_title" label={c.sectionTitle} defaultValue={home.story.title} error={err.story_title} maxLength={160} />
              <BilingualField name="story_body" label={c.sectionBody} defaultValue={home.story.body} multiline rows={3} maxLength={1500} />
            </Section>

            <div id="about" className="scroll-mt-20">
              <Section title={c.aboutPage}>
                <ImageField
                  name="about_image"
                  label={c.aboutImage}
                  initial={images.about}
                  fallback="/brand/cover-960.webp"
                  fallbackNote={c.defaultImage}
                  aspect="aspect-[4/5] max-w-xs"
                />
                <BilingualField name="about_title" label={c.sectionTitle} defaultValue={about.title} error={err.about_title} maxLength={160} />
                <BilingualField
                  name="about_body"
                  label={c.sectionBody}
                  defaultValue={about.body}
                  multiline
                  rows={10}
                  hint={c.paragraphHint}
                  maxLength={8000}
                />
              </Section>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:static lg:rounded-xl lg:border lg:bg-white lg:px-5">
              <SubmitButton>{t.admin.common.save}</SubmitButton>
            </div>
          </>
        );
      }}
    </ActionForm>
  );
}
