import type { Schema, Struct } from '@strapi/strapi';

export interface ArticleSection extends Struct.ComponentSchema {
  collectionName: 'components_article_sections';
  info: {
    displayName: 'Section';
    icon: 'align-left';
  };
  attributes: {
    body: Schema.Attribute.Text;
    caption: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface ConsultationDateOverride extends Struct.ComponentSchema {
  collectionName: 'components_consultation_date_overrides';
  info: {
    displayName: 'Date override';
    icon: 'calendar';
  };
  attributes: {
    closed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    note: Schema.Attribute.String;
    times: Schema.Attribute.Text;
  };
}

export interface ConsultationDayHours extends Struct.ComponentSchema {
  collectionName: 'components_consultation_day_hours';
  info: {
    displayName: 'Weekly hours';
    icon: 'calendar';
  };
  attributes: {
    times: Schema.Attribute.Text;
    weekday: Schema.Attribute.Enumeration<
      [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]
    > &
      Schema.Attribute.Required;
  };
}

export interface ConsultationIncluded extends Struct.ComponentSchema {
  collectionName: 'components_consultation_includeds';
  info: {
    displayName: 'Included item';
    icon: 'check';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ConsultationStep extends Struct.ComponentSchema {
  collectionName: 'components_consultation_steps';
  info: {
    displayName: 'Journey step';
    icon: 'walk';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_hero_slides';
  info: {
    displayName: 'Slide';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String & Schema.Attribute.DefaultTo<''>;
    buttonLabel: Schema.Attribute.String;
    buttonLink: Schema.Attribute.String;
    headline: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    mobileImage: Schema.Attribute.Media<'images'>;
    subtext: Schema.Attribute.Text;
    visible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface ProductSection extends Struct.ComponentSchema {
  collectionName: 'components_product_sections';
  info: {
    displayName: 'Section';
    icon: 'align-left';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    heading: Schema.Attribute.String;
  };
}

export interface ProductSpec extends Struct.ComponentSchema {
  collectionName: 'components_product_specs';
  info: {
    displayName: 'Spec';
    icon: 'layer';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductTab extends Struct.ComponentSchema {
  collectionName: 'components_product_tabs';
  info: {
    description: 'A custom tab on the product page';
    displayName: 'Detail tab';
    icon: 'layout';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    noteBody: Schema.Attribute.Text;
    noteHeading: Schema.Attribute.String;
    sections: Schema.Attribute.Component<'product.section', true>;
    specs: Schema.Attribute.Component<'product.spec', true>;
    tabId: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface QuizAnswer extends Struct.ComponentSchema {
  collectionName: 'components_quiz_answers';
  info: {
    displayName: 'Answer';
    icon: 'check';
  };
  attributes: {
    outcomeName: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface QuizOutcome extends Struct.ComponentSchema {
  collectionName: 'components_quiz_outcomes';
  info: {
    displayName: 'Outcome';
    icon: 'star';
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#6aab7e'>;
    description: Schema.Attribute.Text;
    emoji: Schema.Attribute.String;
    headline: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    products: Schema.Attribute.Component<'quiz.suggestion', true>;
    tips: Schema.Attribute.Text;
  };
}

export interface QuizQuestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_questions';
  info: {
    displayName: 'Question';
    icon: 'question';
  };
  attributes: {
    answers: Schema.Attribute.Component<'quiz.answer', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 2;
        },
        number
      >;
    prompt: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface QuizResult extends Struct.ComponentSchema {
  collectionName: 'components_quiz_results';
  info: {
    displayName: 'Result';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    matches: Schema.Attribute.String & Schema.Attribute.Required;
    products: Schema.Attribute.Component<'quiz.suggestion', true>;
    sections: Schema.Attribute.Component<'quiz.section', true>;
  };
}

export interface QuizSection extends Struct.ComponentSchema {
  collectionName: 'components_quiz_sections';
  info: {
    displayName: 'Result section';
    icon: 'bulletList';
  };
  attributes: {
    body: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
  };
}

export interface QuizSuggestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_suggestions';
  info: {
    displayName: 'Suggested product';
    icon: 'shoppingCart';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    highlighted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface RecipeStat extends Struct.ComponentSchema {
  collectionName: 'components_recipe_stats';
  info: {
    displayName: 'Stat';
    icon: 'clock';
  };
  attributes: {
    bold: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLine extends Struct.ComponentSchema {
  collectionName: 'components_shared_lines';
  info: {
    description: 'A single short line of text (used for lists)';
    displayName: 'Line';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SitePageText extends Struct.ComponentSchema {
  collectionName: 'components_site_page_texts';
  info: {
    displayName: 'Text';
    icon: 'pencil';
  };
  attributes: {
    en: Schema.Attribute.Text;
    fr: Schema.Attribute.Text;
    key: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String;
  };
}

export interface WorkshopDate extends Struct.ComponentSchema {
  collectionName: 'components_workshop_dates';
  info: {
    displayName: 'Date';
    icon: 'calendar';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'article.section': ArticleSection;
      'consultation.date-override': ConsultationDateOverride;
      'consultation.day-hours': ConsultationDayHours;
      'consultation.included': ConsultationIncluded;
      'consultation.step': ConsultationStep;
      'hero.slide': HeroSlide;
      'product.section': ProductSection;
      'product.spec': ProductSpec;
      'product.tab': ProductTab;
      'quiz.answer': QuizAnswer;
      'quiz.outcome': QuizOutcome;
      'quiz.question': QuizQuestion;
      'quiz.result': QuizResult;
      'quiz.section': QuizSection;
      'quiz.suggestion': QuizSuggestion;
      'recipe.stat': RecipeStat;
      'shared.line': SharedLine;
      'site.page-text': SitePageText;
      'workshop.date': WorkshopDate;
    }
  }
}
